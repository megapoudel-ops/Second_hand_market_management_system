"""
Wallet API - Flask + MongoDB
Peer-to-peer transfer system in NPR with:
  - Unique customer wallet IDs (generated once)
  - Deposit / Withdraw
  - Send / Receive between customers
  - 3% commission on every transfer
  - Min transfer: NPR 100 | Max transfer: NPR 999,999
  - Full transaction ledger
  - Integrates with the existing Payment API (app.py)
"""

import os
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv
import certifi

load_dotenv()

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

CURRENCY         = "NPR"
COMMISSION_RATE  = 0.03          # 3%
MIN_TRANSFER     = 100           # NPR
MAX_TRANSFER     = 999_999       # NPR
DEMO_API_KEY     = "wk_test_demo1234567890abcdef"
API_KEY_HEADER   = "X-API-Key"

app = Flask(__name__)
CORS(app, resources={r"/wallet/*": {"origins": "*"}})


# ─────────────────────────────────────────────
# DB
# ─────────────────────────────────────────────

def get_db():
    client = MongoClient(
        os.getenv("MONGO_URI", "mongodb://localhost:27017"),
        tlsCAFile=certifi.where()
    )
    return client["wallet_db"]


def init_db():
    db = get_db()
    db.wallets.create_index("wallet_id",  unique=True)
    db.wallets.create_index("email",      unique=True)
    db.api_keys.create_index("key_hash",  unique=True)
    db.transactions.create_index("txn_id", unique=True)

    if db.api_keys.count_documents({}) == 0:
        db.api_keys.insert_one({
            "id":         str(uuid.uuid4()),
            "name":       "Demo Wallet Key",
            "key_hash":   hashlib.sha256(DEMO_API_KEY.encode()).hexdigest(),
            "key_prefix": "wk_test_demo",
            "is_active":  True,
            "created_at": now_iso()
        })
        print("✅ Demo wallet API key seeded")

    print("✅ Wallet DB Initialised")


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean(doc):
    if doc is None:
        return None
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


def generate_wallet_id():
    """Human-readable unique wallet ID: WLT-XXXXXXXX"""
    return "WLT-" + uuid.uuid4().hex[:8].upper()


def commission_breakdown(amount: float):
    """Return (commission, net_to_receiver)."""
    commission = round(amount * COMMISSION_RATE, 2)
    net        = round(amount - commission, 2)
    return commission, net


def paginate(collection, query_filter, sort_field, page=1, per_page=20):
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
            "total":    total,
            "page":     page,
            "per_page": per_page,
            "pages":    (total + per_page - 1) // per_page
        }
    }


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get(API_KEY_HEADER) or request.args.get("api_key")
        if key == DEMO_API_KEY:
            return f(*args, **kwargs)
        if not key:
            return jsonify(error="Missing API key", code="auth_required"), 401
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        db  = get_db()
        row = db.api_keys.find_one({"key_hash": key_hash, "is_active": True})
        if not row:
            return jsonify(error="Invalid or inactive API key", code="invalid_api_key"), 401
        return f(*args, **kwargs)
    return decorated


# ─────────────────────────────────────────────
# WALLET INFO
# ─────────────────────────────────────────────

@app.get("/wallet")
def wallet_info():
    return jsonify({
        "name":         "Wallet API",
        "version":      "1.0.0",
        "currency":     CURRENCY,
        "commission":   f"{int(COMMISSION_RATE * 100)}% per transfer",
        "min_transfer": MIN_TRANSFER,
        "max_transfer": MAX_TRANSFER,
        "endpoints": {
            "register":     "POST /wallet/customers",
            "list":         "GET  /wallet/customers",
            "get_wallet":   "GET  /wallet/customers/<wallet_id>",
            "deposit":      "POST /wallet/deposit",
            "withdraw":     "POST /wallet/withdraw",
            "transfer":     "POST /wallet/transfer",
            "transactions": "GET  /wallet/transactions",
            "get_txn":      "GET  /wallet/transactions/<txn_id>",
            "analytics":    "GET  /wallet/analytics",
            "bridge_deposit": "POST /wallet/bridge/deposit-from-payment",
            "bridge_balance": "GET  /wallet/bridge/balance/<wallet_id>"
        },
        "auth":     f"Pass your API key in the {API_KEY_HEADER} header",
        "demo_key": DEMO_API_KEY
    })


# ─────────────────────────────────────────────
# CUSTOMER / WALLET REGISTRATION
# ─────────────────────────────────────────────

@app.post("/wallet/customers")
@require_api_key
def register_customer():
    """
    Create a new wallet customer with a unique permanent wallet_id.
    Body: { name, email, phone?, payment_api_customer_id? }
    """
    data = request.get_json(force=True)
    if not data.get("name") or not data.get("email"):
        return jsonify(error="name and email are required", code="validation_error"), 400

    db = get_db()

    existing = db.wallets.find_one({"email": data["email"].lower().strip()})
    if existing:
        return jsonify(
            error="A wallet already exists for this email",
            code="duplicate_wallet",
            wallet_id=existing["wallet_id"]
        ), 409

    wallet_id = generate_wallet_id()
    now       = now_iso()

    wallet = {
        "wallet_id":               wallet_id,
        "name":                    data["name"].strip(),
        "email":                   data["email"].lower().strip(),
        "phone":                   data.get("phone"),
        "balance":                 0.0,
        "currency":                CURRENCY,
        "total_deposited":         0.0,
        "total_withdrawn":         0.0,
        "total_sent":              0.0,
        "total_received":          0.0,
        "total_commission_paid":   0.0,
        "payment_api_customer_id": data.get("payment_api_customer_id"),
        "is_active":               True,
        "created_at":              now,
        "updated_at":              now
    }

    try:
        db.wallets.insert_one(wallet)
    except DuplicateKeyError:
        return jsonify(error="Wallet ID collision — please retry", code="retry"), 500

    return jsonify(clean(db.wallets.find_one({"wallet_id": wallet_id}))), 201


@app.get("/wallet/customers")
@require_api_key
def list_customers():
    db       = get_db()
    page     = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)
    result   = paginate(db.wallets, {}, "created_at", page, per_page)
    return jsonify(result)


@app.get("/wallet/customers/<wallet_id>")
@require_api_key
def get_customer(wallet_id):
    db = get_db()
    wallet = db.wallets.find_one({"wallet_id": wallet_id.upper()})
    if not wallet:
        return jsonify(error="Wallet not found", code="not_found"), 404

    wallet = clean(wallet)
    txns = list(
        db.transactions.find({
            "$or": [
                {"sender_wallet_id":   wallet_id.upper()},
                {"receiver_wallet_id": wallet_id.upper()}
            ]
        }).sort("created_at", DESCENDING).limit(5)
    )
    wallet["recent_transactions"] = [clean(t) for t in txns]
    return jsonify(wallet)


# ─────────────────────────────────────────────
# DEPOSIT
# ─────────────────────────────────────────────

@app.post("/wallet/deposit")
@require_api_key
def deposit():
    """
    Deposit NPR into a wallet (no commission on deposits).
    Body: { wallet_id, amount, note?, payment_api_payment_id? }
    """
    data      = request.get_json(force=True)
    wallet_id = (data.get("wallet_id") or "").upper()
    amount    = data.get("amount")

    if not wallet_id:
        return jsonify(error="wallet_id is required", code="validation_error"), 400
    if not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify(error="amount must be a positive number", code="invalid_amount"), 400

    amount = round(float(amount), 2)
    db     = get_db()

    wallet = db.wallets.find_one({"wallet_id": wallet_id, "is_active": True})
    if not wallet:
        return jsonify(error="Wallet not found or inactive", code="not_found"), 404

    now         = now_iso()
    txn_id      = "TXN-DEP-" + uuid.uuid4().hex[:10].upper()
    new_balance = round(wallet["balance"] + amount, 2)

    db.wallets.update_one(
        {"wallet_id": wallet_id},
        {"$set": {
            "balance":         new_balance,
            "total_deposited": round(wallet.get("total_deposited", 0) + amount, 2),
            "updated_at":      now
        }}
    )

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "deposit",
        "sender_wallet_id":       None,
        "receiver_wallet_id":     wallet_id,
        "amount":                 amount,
        "commission":             0.0,
        "net_amount":             amount,
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   data.get("note", "Deposit"),
        "payment_api_payment_id": data.get("payment_api_payment_id"),
        "created_at":             now
    })

    return jsonify({
        "success":     True,
        "txn_id":      txn_id,
        "wallet_id":   wallet_id,
        "deposited":   amount,
        "new_balance": new_balance,
        "currency":    CURRENCY
    }), 201


# ─────────────────────────────────────────────
# WITHDRAW
# ─────────────────────────────────────────────

@app.post("/wallet/withdraw")
@require_api_key
def withdraw():
    """
    Withdraw NPR from a wallet (no commission on withdrawals).
    Body: { wallet_id, amount, note? }
    """
    data      = request.get_json(force=True)
    wallet_id = (data.get("wallet_id") or "").upper()
    amount    = data.get("amount")

    if not wallet_id:
        return jsonify(error="wallet_id is required", code="validation_error"), 400
    if not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify(error="amount must be a positive number", code="invalid_amount"), 400

    amount = round(float(amount), 2)
    db     = get_db()

    wallet = db.wallets.find_one({"wallet_id": wallet_id, "is_active": True})
    if not wallet:
        return jsonify(error="Wallet not found or inactive", code="not_found"), 404
    if wallet["balance"] < amount:
        return jsonify(
            error=f"Insufficient balance. Available: NPR {wallet['balance']}",
            code="insufficient_balance"
        ), 400

    now         = now_iso()
    txn_id      = "TXN-WDR-" + uuid.uuid4().hex[:10].upper()
    new_balance = round(wallet["balance"] - amount, 2)

    db.wallets.update_one(
        {"wallet_id": wallet_id},
        {"$set": {
            "balance":         new_balance,
            "total_withdrawn": round(wallet.get("total_withdrawn", 0) + amount, 2),
            "updated_at":      now
        }}
    )

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "withdrawal",
        "sender_wallet_id":       wallet_id,
        "receiver_wallet_id":     None,
        "amount":                 amount,
        "commission":             0.0,
        "net_amount":             amount,
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   data.get("note", "Withdrawal"),
        "payment_api_payment_id": None,
        "created_at":             now
    })

    return jsonify({
        "success":     True,
        "txn_id":      txn_id,
        "wallet_id":   wallet_id,
        "withdrawn":   amount,
        "new_balance": new_balance,
        "currency":    CURRENCY
    }), 201


# ─────────────────────────────────────────────
# TRANSFER (Peer-to-Peer Send)
# ─────────────────────────────────────────────

@app.post("/wallet/transfer")
@require_api_key
def transfer():
    """
    Send NPR from one wallet to another.
    Body: { sender_wallet_id, receiver_wallet_id, amount, note? }

    Rules:
      - Min NPR 100  /  Max NPR 999,999
      - 3% commission deducted from the full amount the sender pays
      - Receiver gets (amount - commission)
      - Sender balance must cover the full amount
    """
    data      = request.get_json(force=True)
    sender_id = (data.get("sender_wallet_id")   or "").upper()
    recv_id   = (data.get("receiver_wallet_id") or "").upper()
    amount    = data.get("amount")

    if not sender_id or not recv_id:
        return jsonify(error="sender_wallet_id and receiver_wallet_id are required", code="validation_error"), 400
    if sender_id == recv_id:
        return jsonify(error="Cannot transfer to the same wallet", code="self_transfer"), 400
    if not isinstance(amount, (int, float)):
        return jsonify(error="amount must be a number", code="invalid_amount"), 400

    amount = round(float(amount), 2)

    if amount < MIN_TRANSFER:
        return jsonify(error=f"Minimum transfer is NPR {MIN_TRANSFER}", code="below_minimum"), 400
    if amount > MAX_TRANSFER:
        return jsonify(error=f"Maximum transfer is NPR {MAX_TRANSFER:,}", code="above_maximum"), 400

    db       = get_db()
    sender   = db.wallets.find_one({"wallet_id": sender_id, "is_active": True})
    receiver = db.wallets.find_one({"wallet_id": recv_id,   "is_active": True})

    if not sender:
        return jsonify(error="Sender wallet not found or inactive",   code="not_found"), 404
    if not receiver:
        return jsonify(error="Receiver wallet not found or inactive", code="not_found"), 404

    commission, net = commission_breakdown(amount)

    if sender["balance"] < amount:
        return jsonify(
            error=(f"Insufficient balance. Available: NPR {sender['balance']}, "
                   f"Required: NPR {amount} (includes NPR {commission} commission)"),
            code="insufficient_balance"
        ), 400

    now    = now_iso()
    txn_id = "TXN-TRF-" + uuid.uuid4().hex[:10].upper()

    sender_new_balance   = round(sender["balance"]   - amount, 2)
    receiver_new_balance = round(receiver["balance"] + net,    2)

    db.wallets.update_one(
        {"wallet_id": sender_id},
        {"$set": {
            "balance":               sender_new_balance,
            "total_sent":            round(sender.get("total_sent", 0)            + amount,     2),
            "total_commission_paid": round(sender.get("total_commission_paid", 0) + commission, 2),
            "updated_at":            now
        }}
    )

    db.wallets.update_one(
        {"wallet_id": recv_id},
        {"$set": {
            "balance":        receiver_new_balance,
            "total_received": round(receiver.get("total_received", 0) + net, 2),
            "updated_at":     now
        }}
    )

    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "transfer",
        "sender_wallet_id":       sender_id,
        "sender_name":            sender.get("name"),
        "receiver_wallet_id":     recv_id,
        "receiver_name":          receiver.get("name"),
        "amount":                 amount,
        "commission":             commission,
        "net_amount":             net,
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   data.get("note", ""),
        "payment_api_payment_id": None,
        "created_at":             now
    })

    return jsonify({
        "success":              True,
        "txn_id":               txn_id,
        "sender_wallet_id":     sender_id,
        "receiver_wallet_id":   recv_id,
        "amount_sent":          amount,
        "commission_charged":   commission,
        "commission_rate":      f"{int(COMMISSION_RATE * 100)}%",
        "net_received":         net,
        "currency":             CURRENCY,
        "sender_new_balance":   sender_new_balance,
        "receiver_new_balance": receiver_new_balance
    }), 201


# ─────────────────────────────────────────────
# TRANSACTIONS
# ─────────────────────────────────────────────

@app.get("/wallet/transactions")
@require_api_key
def list_transactions():
    """
    Query params: wallet_id, type (deposit|withdrawal|transfer), page, per_page
    """
    db        = get_db()
    page      = int(request.args.get("page", 1))
    per_page  = min(int(request.args.get("per_page", 20)), 100)
    wallet_id = (request.args.get("wallet_id") or "").upper() or None
    txn_type  = request.args.get("type")

    query_filter = {}
    if wallet_id:
        query_filter["$or"] = [
            {"sender_wallet_id":   wallet_id},
            {"receiver_wallet_id": wallet_id}
        ]
    if txn_type:
        query_filter["type"] = txn_type

    result = paginate(db.transactions, query_filter, "created_at", page, per_page)
    return jsonify(result)


@app.get("/wallet/transactions/<txn_id>")
@require_api_key
def get_transaction(txn_id):
    db  = get_db()
    txn = db.transactions.find_one({"txn_id": txn_id.upper()})
    if not txn:
        return jsonify(error="Transaction not found", code="not_found"), 404
    return jsonify(clean(txn))


# ─────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────

@app.get("/wallet/analytics")
@require_api_key
def analytics():
    db   = get_db()
    txns = list(db.transactions.find({}))

    deposits    = [t for t in txns if t["type"] == "deposit"]
    withdrawals = [t for t in txns if t["type"] == "withdrawal"]
    transfers   = [t for t in txns if t["type"] == "transfer"]

    total_deposited   = round(sum(t["amount"]     for t in deposits),    2)
    total_withdrawn   = round(sum(t["amount"]     for t in withdrawals), 2)
    total_transferred = round(sum(t["amount"]     for t in transfers),   2)
    total_commission  = round(sum(t["commission"] for t in transfers),   2)

    # Daily volume last 30 days
    cutoff    = datetime.now(timezone.utc) - timedelta(days=30)
    daily_map = {}
    for t in txns:
        try:
            dt = datetime.fromisoformat(t["created_at"])
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if dt < cutoff:
                continue
            d = dt.date().isoformat()
            if d not in daily_map:
                daily_map[d] = {"date": d, "deposits": 0, "withdrawals": 0, "transfers": 0, "commission": 0}
            key = t["type"] + "s"
            if key in daily_map[d]:
                daily_map[d][key] = round(daily_map[d][key] + t["amount"], 2)
            if t["type"] == "transfer":
                daily_map[d]["commission"] = round(daily_map[d]["commission"] + t["commission"], 2)
        except Exception:
            continue
    daily_volume = sorted(daily_map.values(), key=lambda x: x["date"])

    # Top senders
    sender_map = {}
    for t in transfers:
        sid = t.get("sender_wallet_id")
        if sid:
            if sid not in sender_map:
                sender_map[sid] = {"wallet_id": sid, "name": t.get("sender_name"), "total_sent": 0, "commission_paid": 0}
            sender_map[sid]["total_sent"]     = round(sender_map[sid]["total_sent"]     + t["amount"],     2)
            sender_map[sid]["commission_paid"] = round(sender_map[sid]["commission_paid"] + t["commission"], 2)
    top_senders = sorted(sender_map.values(), key=lambda x: x["total_sent"], reverse=True)[:5]

    wallets       = list(db.wallets.find({}))
    total_wallets = len(wallets)
    total_balance = round(sum(w.get("balance", 0) for w in wallets), 2)

    return jsonify({
        "summary": {
            "total_wallets":      total_wallets,
            "total_balance_held": total_balance,
            "total_deposited":    total_deposited,
            "total_withdrawn":    total_withdrawn,
            "total_transferred":  total_transferred,
            "total_commission":   total_commission,
            "total_transactions": len(txns),
            "currency":           CURRENCY
        },
        "daily_volume": daily_volume,
        "top_senders":  top_senders
    })


# ─────────────────────────────────────────────
# PAYMENT API BRIDGE ENDPOINTS
# ─────────────────────────────────────────────

@app.post("/wallet/bridge/deposit-from-payment")
@require_api_key
def bridge_deposit_from_payment():
    """
    Called by app.py (Payment API) after a successful payment to auto-deposit
    funds into the linked wallet.
    Body: { wallet_id, amount, payment_api_payment_id }
    """
    data      = request.get_json(force=True)
    wallet_id = (data.get("wallet_id") or "").upper()
    amount    = data.get("amount")
    pay_id    = data.get("payment_api_payment_id")

    if not wallet_id or not amount or not pay_id:
        return jsonify(
            error="wallet_id, amount and payment_api_payment_id are required",
            code="validation_error"
        ), 400

    db = get_db()
    wallet = db.wallets.find_one({"wallet_id": wallet_id, "is_active": True})
    if not wallet:
        return jsonify(error="Wallet not found", code="not_found"), 404

    amount      = round(float(amount), 2)
    now         = now_iso()
    txn_id      = "TXN-DEP-" + uuid.uuid4().hex[:10].upper()
    new_balance = round(wallet["balance"] + amount, 2)

    db.wallets.update_one(
        {"wallet_id": wallet_id},
        {"$set": {
            "balance":         new_balance,
            "total_deposited": round(wallet.get("total_deposited", 0) + amount, 2),
            "updated_at":      now
        }}
    )
    db.transactions.insert_one({
        "txn_id":                 txn_id,
        "type":                   "deposit",
        "sender_wallet_id":       None,
        "receiver_wallet_id":     wallet_id,
        "amount":                 amount,
        "commission":             0.0,
        "net_amount":             amount,
        "currency":               CURRENCY,
        "status":                 "completed",
        "note":                   f"Auto-deposit from Payment API: {pay_id}",
        "payment_api_payment_id": pay_id,
        "created_at":             now
    })

    return jsonify({
        "success":     True,
        "txn_id":      txn_id,
        "wallet_id":   wallet_id,
        "deposited":   amount,
        "new_balance": new_balance,
        "currency":    CURRENCY,
        "source":      "payment_api",
        "payment_id":  pay_id
    }), 201


@app.get("/wallet/bridge/balance/<wallet_id>")
@require_api_key
def bridge_get_balance(wallet_id):
    """
    Lightweight balance check for the Payment API.
    """
    db     = get_db()
    wallet = db.wallets.find_one({"wallet_id": wallet_id.upper()})
    if not wallet:
        return jsonify(error="Wallet not found", code="not_found"), 404
    return jsonify({
        "wallet_id": wallet["wallet_id"],
        "name":      wallet["name"],
        "balance":   wallet["balance"],
        "currency":  CURRENCY
    })


# ─────────────────────────────────────────────
# ERROR HANDLERS
# ─────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Endpoint not found", code="not_found"), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify(error="Method not allowed", code="method_not_allowed"), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Internal server error", code="internal_error"), 500


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    with app.app_context():
        init_db()
    port = int(os.environ.get("WALLET_PORT", 8081))
    print(f"\n🚀 Wallet API running at http://localhost:{port}")
    print(f"🔑 Demo API Key : {DEMO_API_KEY}")
    print(f"📡 API Root     : http://localhost:{port}/wallet\n")
    app.run(host="0.0.0.0", port=port, debug=True)
