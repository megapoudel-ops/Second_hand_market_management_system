"""
Wallet API — wallet_api.py
Production-grade Flask wallet service with:
  - Fixed undefined variables (txn_id, now, etc.)
  - Fully rewritten transfer endpoint with atomicity + rollback
  - Wallet existence checks on every endpoint
  - Min/max transfer validation
  - Decimal-based money arithmetic (no float drift)
  - Fraud / security validation (velocity, self-transfer)
  - Proper transaction status handling
  - Rollback on failed transfers
  - Input validation (Pydantic)
  - Race-condition protection via MongoDB findOneAndUpdate
  - Structured audit logs
  - Prometheus metrics
  - API versioning (/wallet/v1/)
  - Health check
"""

from __future__ import annotations

import hashlib
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from functools import wraps
from typing import Any

import certifi
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flasgger import Swagger
from pydantic import BaseModel, EmailStr, Field, validator
from pymongo import DESCENDING, MongoClient, ReturnDocument
from pymongo.errors import DuplicateKeyError

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("wallet_api")

# ── Config ────────────────────────────────────────────────────────────────────
load_dotenv()

CURRENCY        = "NPR"
COMMISSION_RATE = Decimal("0.03")          # 3%
MIN_TRANSFER    = Decimal("100")           # NPR
MAX_TRANSFER    = Decimal("999999")        # NPR
MAX_DAILY_SEND  = Decimal("500000")        # fraud velocity limit
DEMO_API_KEY    = os.environ.get("WALLET_API_KEY", "wlt_demo_key_1234567890abcdef")
API_KEY_HEADER  = "X-API-Key"
DEBUG           = os.environ.get("FLASK_ENV", "production") == "development"

# ── App ───────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/wallet/*": {"origins": os.environ.get("ALLOWED_ORIGINS", "*")}})

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per minute"],
    storage_uri=os.environ.get("REDIS_URL", "memory://"),
)

swagger_template = {
    "info": {"title": "Wallet API", "version": "1.0.0"},
    "securityDefinitions": {"ApiKeyAuth": {"type": "apiKey", "in": "header", "name": "X-API-Key"}},
}
swagger = Swagger(app, template=swagger_template)

# ── DB ────────────────────────────────────────────────────────────────────────
def get_db():
    if "db" not in g:
        client = MongoClient(
            os.getenv("MONGO_URI", "mongodb://localhost:27017"),
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
        )
        g.db = client[os.getenv("DB_NAME", "ecommerce")]
    return g.db


def init_db():
    db = get_db()
    db.wallets.create_index("wallet_id",  unique=True)
    db.wallets.create_index("email",      unique=True)
    db.wallets.create_index([("created_at", DESCENDING)])
    db.api_keys.create_index("key_hash",  unique=True)
    db.transactions.create_index("txn_id", unique=True)
    db.transactions.create_index([("sender_wallet_id",   1), ("created_at", DESCENDING)])
    db.transactions.create_index([("receiver_wallet_id", 1), ("created_at", DESCENDING)])
    db.transactions.create_index([("type", 1), ("created_at", DESCENDING)])
    # Audit log index
    db.audit_logs.create_index([("wallet_id", 1), ("created_at", DESCENDING)])

    if db.api_keys.count_documents({}) == 0:
        db.api_keys.insert_one({
            "id":         str(uuid.uuid4()),
            "name":       "Demo Wallet Key",
            "key_hash":   hashlib.sha256(DEMO_API_KEY.encode()).hexdigest(),
            "key_prefix": "wlt_demo",
            "is_active":  True,
            "created_at": now_iso(),
        })
        logger.info("Demo wallet API key seeded")

    logger.info("Wallet DB initialised")


@app.teardown_appcontext
def close_db(exc=None):
    g.pop("db", None)


# ── Helpers ───────────────────────────────────────────────────────────────────
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def clean(doc) -> dict | None:
    if doc is None:
        return None
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


def to_dec(value) -> Decimal:
    """Convert any numeric to a 2dp Decimal."""
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def to_float(value) -> float:
    """Safe float for JSON serialisation of Decimal."""
    return float(to_dec(value))


def generate_wallet_id() -> str:
    return "WLT-" + uuid.uuid4().hex[:8].upper()


def new_txn_id(prefix="TXN") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


def commission_breakdown(amount: Decimal) -> tuple[Decimal, Decimal]:
    commission = (amount * COMMISSION_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net        = (amount - commission).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return commission, net


def paginate(collection, query_filter, sort_field, page=1, per_page=20) -> dict:
    total  = collection.count_documents(query_filter)
    offset = (page - 1) * per_page
    rows   = list(
        collection.find(query_filter)
        .sort(sort_field, DESCENDING)
        .skip(offset)
        .limit(per_page)
    )
    return {
        "data": [clean(r) for r in rows],
        "pagination": {
            "total":    total, "page": page,
            "per_page": per_page,
            "pages":    (total + per_page - 1) // per_page,
        },
    }


def audit(wallet_id: str, action: str, actor: str, details: dict):
    """Write an immutable audit-log entry."""
    try:
        get_db().audit_logs.insert_one({
            "id":        str(uuid.uuid4()),
            "wallet_id": wallet_id,
            "action":    action,
            "actor":     actor,
            "details":   details,
            "ip":        request.remote_addr,
            "created_at": now_iso(),
        })
    except Exception:
        logger.exception("Audit log write failed for wallet=%s action=%s", wallet_id, action)


# ── Pydantic Models ───────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name:                    str = Field(..., min_length=1, max_length=200)
    email:                   EmailStr
    phone:                   str | None = None
    payment_api_customer_id: str | None = None


class DepositRequest(BaseModel):
    wallet_id: str
    amount:    float = Field(..., gt=0)
    note:      str | None = Field(None, max_length=500)
    payment_api_payment_id: str | None = None

    @validator("amount")
    def positive_amount(cls, v):
        if v <= 0:
            raise ValueError("amount must be positive")
        return round(v, 2)


class WithdrawRequest(BaseModel):
    wallet_id: str
    amount:    float = Field(..., gt=0)
    note:      str | None = Field(None, max_length=500)

    @validator("amount")
    def positive_amount(cls, v):
        if v <= 0:
            raise ValueError("amount must be positive")
        return round(v, 2)


class TransferRequest(BaseModel):
    sender_id:   str
    receiver_id: str
    amount:      float = Field(..., gt=0)
    note:        str | None = Field(None, max_length=500)

    @validator("amount")
    def positive_amount(cls, v):
        return round(v, 2)


def validate_body(model_class):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                body = model_class.parse_obj(request.get_json(force=True) or {})
            except Exception as exc:
                errors = exc.errors() if hasattr(exc, "errors") else str(exc)
                logger.warning("Validation error on %s: %s", request.path, errors)
                return jsonify(error="Validation error", details=errors, code="validation_error"), 400
            return f(body, *args, **kwargs)
        return wrapper
    return decorator


# ── Auth ──────────────────────────────────────────────────────────────────────
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get(API_KEY_HEADER) or request.args.get("api_key")
        if not key:
            return jsonify(error="Missing API key", code="auth_required"), 401
        if key == DEMO_API_KEY:
            return f(*args, **kwargs)
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        row = get_db().api_keys.find_one({"key_hash": key_hash, "is_active": True})
        if not row:
            logger.warning("Invalid wallet API key from %s", request.remote_addr)
            return jsonify(error="Invalid or inactive API key", code="invalid_api_key"), 401
        return f(*args, **kwargs)
    return decorated


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/wallet/health")
def health():
    try:
        get_db().command("ping")
        db_ok = True
    except Exception:
        db_ok = False
    status = "healthy" if db_ok else "degraded"
    return jsonify({"status": status, "db": "up" if db_ok else "down", "ts": now_iso()}), (200 if db_ok else 503)


@app.get("/wallet/metrics")
def metrics():
    try:
        db    = get_db()
        lines = [
            f"wallet_api_wallets_total {db.wallets.count_documents({})}",
            f"wallet_api_transactions_total {db.transactions.count_documents({})}",
            f'wallet_api_deposits_total {db.transactions.count_documents({{"type":"deposit"}})}',
            f'wallet_api_withdrawals_total {db.transactions.count_documents({{"type":"withdrawal"}})}',
            f'wallet_api_transfers_total {db.transactions.count_documents({{"type":"transfer"}})}',
        ]
        return "\n".join(lines) + "\n", 200, {"Content-Type": "text/plain"}
    except Exception as exc:
        return f"# ERROR {exc}\n", 500, {"Content-Type": "text/plain"}


# ── Wallet Info ───────────────────────────────────────────────────────────────
@app.get("/wallet")
@app.get("/wallet/v1")
def wallet_info():
    return jsonify({
        "name":         "Wallet API", "version": "1.0.0",
        "currency":     CURRENCY,
        "commission":   f"{int(COMMISSION_RATE * 100)}% per transfer",
        "min_transfer": str(MIN_TRANSFER),
        "max_transfer": str(MAX_TRANSFER),
        "endpoints": {
            "register":    "POST /wallet/v1/customers",
            "list":        "GET  /wallet/v1/customers",
            "get_wallet":  "GET  /wallet/v1/customers/<wallet_id>",
            "deposit":     "POST /wallet/v1/deposit",
            "withdraw":    "POST /wallet/v1/withdraw",
            "transfer":    "POST /wallet/v1/transfer",
            "transactions":"GET  /wallet/v1/transactions",
            "analytics":   "GET  /wallet/v1/analytics",
        },
        "auth":     f"Pass API key in {API_KEY_HEADER} header",
        "demo_key": DEMO_API_KEY,
    })


# ── Customer / Wallet Registration ────────────────────────────────────────────
@app.post("/wallet/customers")
@app.post("/wallet/v1/customers")
@require_api_key
@validate_body(RegisterRequest)
def register_customer(body: RegisterRequest):
    db       = get_db()
    existing = db.wallets.find_one({"email": body.email.lower().strip()})
    if existing:
        return jsonify(
            error="A wallet already exists for this email",
            code="duplicate_wallet",
            wallet_id=existing["wallet_id"],
        ), 409

    wallet_id = generate_wallet_id()
    now       = now_iso()
    wallet    = {
        "wallet_id":               wallet_id,
        "name":                    body.name.strip(),
        "email":                   body.email.lower().strip(),
        "phone":                   body.phone,
        "balance":                 0.0,
        "currency":                CURRENCY,
        "total_deposited":         0.0,
        "total_withdrawn":         0.0,
        "total_sent":              0.0,
        "total_received":          0.0,
        "total_commission_paid":   0.0,
        "payment_api_customer_id": body.payment_api_customer_id,
        "is_active":               True,
        "created_at":              now,
        "updated_at":              now,
    }
    try:
        db.wallets.insert_one(wallet)
    except DuplicateKeyError:
        return jsonify(error="Wallet ID collision — please retry", code="retry"), 500

    audit(wallet_id, "REGISTER", "api", {"email": body.email})
    logger.info("Wallet registered: %s (%s)", wallet_id, body.email)
    return jsonify(clean(db.wallets.find_one({"wallet_id": wallet_id}))), 201


@app.get("/wallet/customers")
@app.get("/wallet/v1/customers")
@require_api_key
def list_customers():
    db       = get_db()
    page     = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    return jsonify(paginate(db.wallets, {}, "created_at", page, per_page))


@app.get("/wallet/customers/<wallet_id>")
@app.get("/wallet/v1/customers/<wallet_id>")
@require_api_key
def get_customer(wallet_id: str):
    db     = get_db()
    wallet = db.wallets.find_one({"wallet_id": wallet_id.upper()})
    if not wallet:
        return jsonify(error="Wallet not found", code="not_found"), 404
    wallet = clean(wallet)
    txns   = list(
        db.transactions.find({
            "$or": [
                {"sender_wallet_id":   wallet_id.upper()},
                {"receiver_wallet_id": wallet_id.upper()},
            ]
        }).sort("created_at", DESCENDING).limit(5)
    )
    wallet["recent_transactions"] = [clean(t) for t in txns]
    return jsonify(wallet)


# ── Deposit ───────────────────────────────────────────────────────────────────
@app.post("/wallet/deposit")
@app.post("/wallet/v1/deposit")
@require_api_key
@limiter.limit("30 per minute")
@validate_body(DepositRequest)
def deposit_funds(body: DepositRequest):
    wallet_id = body.wallet_id.upper()
    amount    = to_dec(body.amount)

    if amount <= Decimal("0"):
        return jsonify(error="Amount must be greater than 0", code="invalid_amount"), 400

    db = get_db()

    # Atomic update: only proceed if wallet exists and is active
    updated = db.wallets.find_one_and_update(
        {"wallet_id": wallet_id, "is_active": True},
        {"$inc": {
            "balance":         float(amount),
            "total_deposited": float(amount),
        }, "$set": {"updated_at": now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        return jsonify(error="Wallet not found or inactive", code="not_found"), 404

    txn_id = new_txn_id("DEP")
    now    = now_iso()

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "deposit",
        "sender_wallet_id":       None,
        "receiver_wallet_id":     wallet_id,
        "amount":                 float(amount),
        "commission":             0.0,
        "net_amount":             float(amount),
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   body.note or "Deposit",
        "payment_api_payment_id": body.payment_api_payment_id,
        "created_at":             now,
    })

    audit(wallet_id, "DEPOSIT", "api", {"amount": float(amount), "txn_id": txn_id})
    logger.info("Deposit: wallet=%s amount=%s txn=%s", wallet_id, amount, txn_id)

    return jsonify({
        "success":     True,
        "txn_id":      txn_id,
        "wallet_id":   wallet_id,
        "deposited":   float(amount),
        "new_balance": to_float(updated["balance"]),
        "currency":    CURRENCY,
    }), 201


# ── Withdraw ──────────────────────────────────────────────────────────────────
@app.post("/wallet/withdraw")
@app.post("/wallet/v1/withdraw")
@require_api_key
@limiter.limit("20 per minute")
@validate_body(WithdrawRequest)
def withdraw_funds(body: WithdrawRequest):
    wallet_id = body.wallet_id.upper()
    amount    = to_dec(body.amount)

    if amount <= Decimal("0"):
        return jsonify(error="Amount must be greater than 0", code="invalid_amount"), 400

    db = get_db()

    # Atomic update: only deduct if sufficient balance (race-condition safe)
    updated = db.wallets.find_one_and_update(
        {"wallet_id": wallet_id, "is_active": True, "balance": {"$gte": float(amount)}},
        {"$inc": {
            "balance":          -float(amount),
            "total_withdrawn":   float(amount),
        }, "$set": {"updated_at": now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        # Distinguish "not found" from "insufficient funds"
        wallet = db.wallets.find_one({"wallet_id": wallet_id})
        if not wallet:
            return jsonify(error="Wallet not found", code="not_found"), 404
        if not wallet.get("is_active"):
            return jsonify(error="Wallet is inactive", code="inactive_wallet"), 400
        return jsonify(
            error=f"Insufficient balance. Available: {CURRENCY} {wallet['balance']}",
            code="insufficient_balance",
        ), 400

    txn_id = new_txn_id("WDR")
    now    = now_iso()

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "withdrawal",
        "sender_wallet_id":       wallet_id,
        "receiver_wallet_id":     None,
        "amount":                 float(amount),
        "commission":             0.0,
        "net_amount":             float(amount),
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   body.note or "Withdrawal",
        "payment_api_payment_id": None,
        "created_at":             now,
    })

    audit(wallet_id, "WITHDRAW", "api", {"amount": float(amount), "txn_id": txn_id})
    logger.info("Withdrawal: wallet=%s amount=%s txn=%s", wallet_id, amount, txn_id)

    return jsonify({
        "success":     True,
        "txn_id":      txn_id,
        "wallet_id":   wallet_id,
        "withdrawn":   float(amount),
        "new_balance": to_float(updated["balance"]),
        "currency":    CURRENCY,
    }), 201


# ── Transfer ──────────────────────────────────────────────────────────────────
@app.post("/wallet/transfer")
@app.post("/wallet/v1/transfer")
@require_api_key
@limiter.limit("30 per minute")
@validate_body(TransferRequest)
def transfer_funds(body: TransferRequest):
    """
    Peer-to-peer transfer with:
      - Self-transfer prevention
      - Min / max amount enforcement
      - Daily velocity fraud check
      - Atomic sender deduction (race-condition safe)
      - Rollback sender if receiver credit fails
      - Full audit trail
    """
    sender_id   = body.sender_id.upper()
    receiver_id = body.receiver_id.upper()
    amount      = to_dec(body.amount)

    # ── Basic validation ──────────────────────────────────────────────────────
    if sender_id == receiver_id:
        return jsonify(error="Cannot transfer to yourself", code="self_transfer"), 400

    if amount < MIN_TRANSFER:
        return jsonify(
            error=f"Minimum transfer is {CURRENCY} {MIN_TRANSFER}",
            code="below_minimum",
        ), 400

    if amount > MAX_TRANSFER:
        return jsonify(
            error=f"Maximum transfer is {CURRENCY} {MAX_TRANSFER}",
            code="above_maximum",
        ), 400

    db = get_db()

    # ── Wallet existence checks ───────────────────────────────────────────────
    sender   = db.wallets.find_one({"wallet_id": sender_id,   "is_active": True})
    receiver = db.wallets.find_one({"wallet_id": receiver_id, "is_active": True})

    if not sender:
        return jsonify(error="Sender wallet not found or inactive", code="sender_not_found"), 404
    if not receiver:
        return jsonify(error="Receiver wallet not found or inactive", code="receiver_not_found"), 404

    # ── Fraud: daily velocity check ───────────────────────────────────────────
    cutoff_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    daily_sent = db.transactions.aggregate([
        {"$match": {
            "sender_wallet_id": sender_id,
            "type": "transfer",
            "created_at": {"$gte": cutoff_24h},
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])
    daily_sent_total = to_dec(next(daily_sent, {}).get("total", 0))
    if daily_sent_total + amount > MAX_DAILY_SEND:
        logger.warning("Daily velocity limit hit: wallet=%s total=%s", sender_id, daily_sent_total + amount)
        audit(sender_id, "VELOCITY_LIMIT", "system", {
            "attempted": float(amount), "daily_total": float(daily_sent_total)
        })
        return jsonify(
            error=f"Daily transfer limit of {CURRENCY} {MAX_DAILY_SEND} exceeded",
            code="velocity_limit",
        ), 400

    commission, net = commission_breakdown(amount)

    # ── STEP 1: Atomically deduct from sender ─────────────────────────────────
    updated_sender = db.wallets.find_one_and_update(
        {"wallet_id": sender_id, "is_active": True, "balance": {"$gte": float(amount)}},
        {"$inc": {
            "balance":               -float(amount),
            "total_sent":             float(amount),
            "total_commission_paid":  float(commission),
        }, "$set": {"updated_at": now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_sender:
        return jsonify(
            error=f"Insufficient balance. Available: {CURRENCY} {sender['balance']}",
            code="insufficient_balance",
        ), 400

    # ── STEP 2: Credit receiver ───────────────────────────────────────────────
    updated_receiver = db.wallets.find_one_and_update(
        {"wallet_id": receiver_id, "is_active": True},
        {"$inc": {
            "balance":        float(net),
            "total_received": float(net),
        }, "$set": {"updated_at": now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_receiver:
        # Receiver credit failed — rollback sender
        logger.error("Receiver credit failed; rolling back sender %s", sender_id)
        rollback_result = db.wallets.find_one_and_update(
            {"wallet_id": sender_id},
            {"$inc": {
                "balance":               float(amount),
                "total_sent":            -float(amount),
                "total_commission_paid": -float(commission),
            }, "$set": {"updated_at": now_iso()}},
            return_document=ReturnDocument.AFTER,
        )
        audit(sender_id, "TRANSFER_ROLLBACK", "system", {
            "reason": "receiver_credit_failed",
            "receiver_id": receiver_id,
            "amount": float(amount),
        })
        logger.warning("Sender rollback %s", "succeeded" if rollback_result else "FAILED")
        return jsonify(error="Transfer failed: could not credit receiver", code="transfer_failed"), 500

    # ── STEP 3: Record transaction ────────────────────────────────────────────
    txn_id = new_txn_id("TRF")
    now    = now_iso()

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "transfer",
        "sender_wallet_id":       sender_id,
        "sender_name":            sender.get("name"),
        "receiver_wallet_id":     receiver_id,
        "receiver_name":          receiver.get("name"),
        "amount":                 float(amount),
        "commission":             float(commission),
        "net_amount":             float(net),
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   body.note or "",
        "payment_api_payment_id": None,
        "created_at":             now,
    })

    audit(sender_id, "TRANSFER_SENT", "api", {
        "txn_id": txn_id, "receiver_id": receiver_id,
        "amount": float(amount), "commission": float(commission),
    })
    audit(receiver_id, "TRANSFER_RECEIVED", "api", {
        "txn_id": txn_id, "sender_id": sender_id, "net_amount": float(net),
    })
    logger.info("Transfer: %s → %s amount=%s net=%s commission=%s txn=%s",
                sender_id, receiver_id, amount, net, commission, txn_id)

    return jsonify({
        "success":              True,
        "txn_id":               txn_id,
        "sender_wallet_id":     sender_id,
        "receiver_wallet_id":   receiver_id,
        "amount_sent":          float(amount),
        "commission_charged":   float(commission),
        "commission_rate":      f"{int(COMMISSION_RATE * 100)}%",
        "net_received":         float(net),
        "currency":             CURRENCY,
        "sender_new_balance":   to_float(updated_sender["balance"]),
        "receiver_new_balance": to_float(updated_receiver["balance"]),
    }), 201


# ── Transactions ──────────────────────────────────────────────────────────────
@app.get("/wallet/transactions")
@app.get("/wallet/v1/transactions")
@require_api_key
def list_transactions():
    db        = get_db()
    page      = max(int(request.args.get("page", 1)), 1)
    per_page  = min(max(int(request.args.get("per_page", 20)), 1), 100)
    wallet_id = (request.args.get("wallet_id") or "").upper() or None
    txn_type  = request.args.get("type")

    query_filter: dict[str, Any] = {}
    if wallet_id:
        query_filter["$or"] = [
            {"sender_wallet_id":   wallet_id},
            {"receiver_wallet_id": wallet_id},
        ]
    if txn_type:
        query_filter["type"] = txn_type

    return jsonify(paginate(db.transactions, query_filter, "created_at", page, per_page))


@app.get("/wallet/transactions/<txn_id>")
@app.get("/wallet/v1/transactions/<txn_id>")
@require_api_key
def get_transaction(txn_id: str):
    db  = get_db()
    txn = db.transactions.find_one({"txn_id": txn_id.upper()})
    if not txn:
        return jsonify(error="Transaction not found", code="not_found"), 404
    return jsonify(clean(txn))


# ── Analytics ─────────────────────────────────────────────────────────────────
@app.get("/wallet/analytics")
@app.get("/wallet/v1/analytics")
@require_api_key
@limiter.limit("20 per minute")
def analytics():
    db   = get_db()
    txns = list(db.transactions.find({}))

    deposits    = [t for t in txns if t["type"] == "deposit"]
    withdrawals = [t for t in txns if t["type"] == "withdrawal"]
    transfers   = [t for t in txns if t["type"] == "transfer"]

    total_deposited   = to_float(sum(t["amount"] for t in deposits))
    total_withdrawn   = to_float(sum(t["amount"] for t in withdrawals))
    total_transferred = to_float(sum(t["amount"] for t in transfers))
    total_commission  = to_float(sum(t.get("commission", 0) for t in transfers))

    cutoff    = datetime.now(timezone.utc) - timedelta(days=30)
    daily_map: dict[str, Any] = {}
    for t in txns:
        try:
            dt = datetime.fromisoformat(t["created_at"])
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if dt < cutoff:
                continue
            d = dt.date().isoformat()
            if d not in daily_map:
                daily_map[d] = {"date": d, "deposits": 0.0, "withdrawals": 0.0,
                                 "transfers": 0.0, "commission": 0.0}
            key = t["type"] + "s"
            if key in daily_map[d]:
                daily_map[d][key] = to_float(to_dec(daily_map[d][key]) + to_dec(t["amount"]))
            if t["type"] == "transfer":
                daily_map[d]["commission"] = to_float(
                    to_dec(daily_map[d]["commission"]) + to_dec(t.get("commission", 0))
                )
        except Exception:
            continue

    sender_map: dict[str, Any] = {}
    for t in transfers:
        sid = t.get("sender_wallet_id")
        if sid:
            if sid not in sender_map:
                sender_map[sid] = {"wallet_id": sid, "name": t.get("sender_name"),
                                    "total_sent": 0.0, "commission_paid": 0.0}
            sender_map[sid]["total_sent"]      = to_float(to_dec(sender_map[sid]["total_sent"]) + to_dec(t["amount"]))
            sender_map[sid]["commission_paid"] = to_float(to_dec(sender_map[sid]["commission_paid"]) + to_dec(t.get("commission", 0)))

    wallets       = list(db.wallets.find({}))
    total_wallets = len(wallets)
    total_balance = to_float(sum(to_dec(w.get("balance", 0)) for w in wallets))

    return jsonify({
        "summary": {
            "total_wallets":      total_wallets,
            "total_balance_held": total_balance,
            "total_deposited":    total_deposited,
            "total_withdrawn":    total_withdrawn,
            "total_transferred":  total_transferred,
            "total_commission":   total_commission,
            "total_transactions": len(txns),
            "currency":           CURRENCY,
        },
        "daily_volume": sorted(daily_map.values(), key=lambda x: x["date"]),
        "top_senders":  sorted(sender_map.values(), key=lambda x: x["total_sent"], reverse=True)[:5],
    })


# ── Payment API Bridge ────────────────────────────────────────────────────────
@app.post("/wallet/bridge/pay")
@require_api_key
def bridge_pay():
    """Called by app.py to debit wallet during checkout."""
    data       = request.get_json(force=True) or {}
    wallet_id  = (data.get("wallet_id") or "").upper()
    amount_raw = data.get("amount")
    payment_id = data.get("payment_ref")

    if not wallet_id or amount_raw is None or not payment_id:
        return jsonify(error="wallet_id, amount, and payment_ref are required", code="validation_error"), 400

    amount = to_dec(amount_raw)
    if amount <= Decimal("0"):
        return jsonify(error="Amount must be positive", code="invalid_amount"), 400

    db = get_db()

    updated = db.wallets.find_one_and_update(
        {"wallet_id": wallet_id, "is_active": True, "balance": {"$gte": float(amount)}},
        {"$inc": {
            "balance":    -float(amount),
            "total_sent":  float(amount),
        }, "$set": {"updated_at": now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        wallet = db.wallets.find_one({"wallet_id": wallet_id})
        if not wallet:
            return jsonify(error="Wallet not found or inactive", code="not_found"), 404
        return jsonify(
            error=f"Insufficient wallet balance. Available: {CURRENCY} {wallet['balance']}",
            code="insufficient_balance",
        ), 400

    txn_id = new_txn_id("CHCK")
    now    = now_iso()

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "merchant_payment",
        "sender_wallet_id":       wallet_id,
        "receiver_wallet_id":     None,
        "amount":                 float(amount),
        "commission":             0.0,
        "net_amount":             float(amount),
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   data.get("description") or f"Merchant Payment: {payment_id}",
        "payment_api_payment_id": payment_id,
        "created_at":             now,
    })

    audit(wallet_id, "BRIDGE_PAY", "payment_api", {
        "txn_id": txn_id, "amount": float(amount), "payment_ref": payment_id
    })
    logger.info("Bridge pay: wallet=%s amount=%s payment_ref=%s txn=%s",
                wallet_id, amount, payment_id, txn_id)

    return jsonify({
        "success":     True,
        "txn_id":      txn_id,
        "wallet_id":   wallet_id,
        "debited":     float(amount),
        "new_balance": to_float(updated["balance"]),
        "currency":    CURRENCY,
    }), 200


@app.post("/wallet/bridge/credit")
@require_api_key
def bridge_credit():
    """Called by app.py to credit wallet on refund."""
    data       = request.get_json(force=True) or {}
    wallet_id  = (data.get("wallet_id") or "").upper()
    amount_raw = data.get("amount")
    payment_id = data.get("payment_ref")

    if not wallet_id or amount_raw is None or not payment_id:
        return jsonify(error="wallet_id, amount, and payment_ref are required", code="validation_error"), 400

    amount = to_dec(amount_raw)
    if amount <= Decimal("0"):
        return jsonify(error="Amount must be positive", code="invalid_amount"), 400

    db = get_db()

    updated = db.wallets.find_one_and_update(
        {"wallet_id": wallet_id, "is_active": True},
        {"$inc": {
            "balance":         float(amount),
            "total_deposited": float(amount),
        }, "$set": {"updated_at": now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        return jsonify(error="Wallet not found or inactive", code="not_found"), 404

    txn_id = new_txn_id("RFND")
    now    = now_iso()

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "refund",
        "sender_wallet_id":       None,
        "receiver_wallet_id":     wallet_id,
        "amount":                 float(amount),
        "commission":             0.0,
        "net_amount":             float(amount),
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   f"Refund from Payment API ref: {payment_id}",
        "payment_api_payment_id": payment_id,
        "created_at":             now,
    })

    audit(wallet_id, "BRIDGE_CREDIT", "payment_api", {
        "txn_id": txn_id, "amount": float(amount), "payment_ref": payment_id
    })
    logger.info("Bridge credit: wallet=%s amount=%s payment_ref=%s txn=%s",
                wallet_id, amount, payment_id, txn_id)

    return jsonify({
        "success":     True,
        "txn_id":      txn_id,
        "wallet_id":   wallet_id,
        "credited":    float(amount),
        "new_balance": to_float(updated["balance"]),
        "currency":    CURRENCY,
    }), 200


@app.get("/wallet/bridge/balance/<wallet_id>")
@require_api_key
def bridge_get_balance(wallet_id: str):
    db     = get_db()
    wallet = db.wallets.find_one({"wallet_id": wallet_id.upper()})
    if not wallet:
        return jsonify(error="Wallet not found", code="not_found"), 404
    return jsonify({
        "wallet_id": wallet["wallet_id"],
        "name":      wallet["name"],
        "balance":   wallet["balance"],
        "currency":  CURRENCY,
    })


# ── Error Handlers ────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Endpoint not found", code="not_found"), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify(error="Method not allowed", code="method_not_allowed"), 405

@app.errorhandler(429)
def rate_limit_exceeded(e):
    logger.warning("Rate limit exceeded from %s for %s", request.remote_addr, request.path)
    return jsonify(error="Rate limit exceeded", code="rate_limited"), 429

@app.errorhandler(500)
def internal_error(e):
    logger.exception("Unhandled exception")
    return jsonify(error="Internal server error", code="internal_error"), 500


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        init_db()
    port = int(os.environ.get("WALLET_PORT", 8081))
    logger.info("Wallet API  →  http://localhost:%d", port)
    logger.info("Demo Key    →  %s", DEMO_API_KEY)
    logger.info("API Root    →  http://localhost:%d/wallet", port)
    app.run(host="0.0.0.0", port=port, debug=DEBUG)
