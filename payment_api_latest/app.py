"""
Payment API System - Flask + MongoDB Backend
Updated to support Wallet API integration.
Wallet API runs on port 8081 (wallet_api.py)
"""
from pymongo import MongoClient, DESCENDING
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv
import uuid
import hashlib
import requests as http_requests
import os
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import certifi

load_dotenv()

# ─── App Setup ────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR   = os.path.join(BASE_DIR, "..", "frontend", "public")
API_KEY_HEADER = "X-API-Key"

WALLET_API_URL = os.environ.get("WALLET_API_URL", "http://localhost:8081")
WALLET_API_KEY = os.environ.get("WALLET_API_KEY", "wlt_demo_key_1234567890abcdef")

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ─── MongoDB ──────────────────────────────────────────────────────────────────
def get_db():
    client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"), tlsCAFile=certifi.where())
    return client["payments_db"]

def init_db():
    db = get_db()
    db.customers.create_index("email", unique=True)
    db.api_keys.create_index("key_hash", unique=True)
    if db.api_keys.count_documents({}) == 0:
        raw_key  = "pk_test_demo1234567890abcdef"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        db.api_keys.insert_one({"id": str(uuid.uuid4()), "name": "Demo Key", "key_hash": key_hash, "key_prefix": "pk_test_demo", "is_active": 1, "created_at": now_iso()})
    if db.customers.count_documents({}) == 0:
        db.customers.insert_many([
            {"id": str(uuid.uuid4()), "name": "Alice Johnson", "email": "alice@example.com", "phone": "+1-555-0101", "created_at": now_iso(), "updated_at": now_iso()},
            {"id": str(uuid.uuid4()), "name": "Bob Martinez",  "email": "bob@example.com",   "phone": "+1-555-0102", "created_at": now_iso(), "updated_at": now_iso()},
            {"id": str(uuid.uuid4()), "name": "Carol Williams","email": "carol@example.com",  "phone": "+1-555-0103", "created_at": now_iso(), "updated_at": now_iso()},
        ])
    print("✅ Payment DB Initialised")

# ─── Auth ─────────────────────────────────────────────────────────────────────
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get(API_KEY_HEADER) or request.args.get("api_key")
        if key == "pk_test_demo1234567890abcdef":
            return f(*args, **kwargs)
        if not key:
            return jsonify(error="Missing API key", code="auth_required"), 401
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        row = get_db().api_keys.find_one({"key_hash": key_hash, "is_active": 1})
        if not row:
            return jsonify(error="Invalid or inactive API key", code="invalid_api_key"), 401
        return f(*args, **kwargs)
    return decorated

# ─── Helpers ──────────────────────────────────────────────────────────────────
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def clean_doc(doc):
    if doc is None: return None
    doc = dict(doc); doc.pop("_id", None); return doc

def paginate_collection(collection, query_filter, sort_field, page=1, per_page=20):
    total  = collection.count_documents(query_filter)
    offset = (page - 1) * per_page
    rows   = list(collection.find(query_filter).sort(sort_field, DESCENDING).skip(offset).limit(per_page))
    return {"data": [clean_doc(r) for r in rows], "pagination": {"total": total, "page": page, "per_page": per_page, "pages": (total + per_page - 1) // per_page}}

# ─── Wallet Bridge ────────────────────────────────────────────────────────────
def wallet_debit(wallet_id, amount, payment_ref, description=""):
    try:
        r = http_requests.post(f"{WALLET_API_URL}/api/payment-bridge/pay",
            json={"wallet_id": wallet_id, "amount": amount, "payment_ref": payment_ref, "description": description},
            headers={"X-API-Key": WALLET_API_KEY}, timeout=5)
        return r.status_code in (200, 201), r.json()
    except Exception as e:
        return False, {"error": str(e)}

def wallet_credit(wallet_id, amount, payment_ref, reason="refund"):
    try:
        r = http_requests.post(f"{WALLET_API_URL}/api/payment-bridge/credit",
            json={"wallet_id": wallet_id, "amount": amount, "payment_ref": payment_ref, "reason": reason},
            headers={"X-API-Key": WALLET_API_KEY}, timeout=5)
        return r.status_code in (200, 201), r.json()
    except Exception as e:
        return False, {"error": str(e)}

# ─── Frontend ─────────────────────────────────────────────────────────────────
@app.route("/")
@app.route("/dashboard")
def index():
    if os.path.exists(os.path.join(FRONTEND_DIR, "index.html")):
        return send_from_directory(FRONTEND_DIR, "index.html")
    return jsonify({"message": "Payment API running. Use /api endpoints."}), 200

# ─── API Info ─────────────────────────────────────────────────────────────────
@app.get("/api")
def api_info():
    return jsonify({
        "name": "Payment API", "version": "1.0.0", "status": "operational",
        "endpoints": {"payments": "/api/payments", "customers": "/api/customers", "payment_methods": "/api/payment-methods", "refunds": "/api/refunds", "analytics": "/api/analytics"},
        "wallet_integration": {"enabled": True, "wallet_api": WALLET_API_URL, "usage": "Pass wallet_id in POST /api/payments to debit wallet balance"},
        "auth": f"Pass API key in {API_KEY_HEADER} header", "demo_key": "pk_test_demo1234567890abcdef"
    })

# ─── Payments ─────────────────────────────────────────────────────────────────
@app.get("/api/payments")
@require_api_key
def list_payments():
    db = get_db()
    page, per_page = int(request.args.get("page", 1)), min(int(request.args.get("per_page", 20)), 100)
    qf = {}
    if request.args.get("status"):      qf["status"]      = request.args.get("status")
    if request.args.get("customer_id"): qf["customer_id"] = request.args.get("customer_id")
    if request.args.get("currency"):    qf["currency"]    = request.args.get("currency").upper()
    total = db.payments.count_documents(qf)
    payments = list(db.payments.find(qf).sort("created_at", DESCENDING).skip((page-1)*per_page).limit(per_page))
    result = []
    for p in payments:
        p = clean_doc(p)
        if p.get("customer_id"):
            c = db.customers.find_one({"id": p["customer_id"]})
            if c: p["customer_name"] = c.get("name"); p["customer_email"] = c.get("email")
        result.append(p)
    return jsonify({"data": result, "pagination": {"total": total, "page": page, "per_page": per_page, "pages": (total+per_page-1)//per_page}})

@app.post("/api/payments")
@require_api_key
def create_payment():
    """
    Create a payment.
    Pass wallet_id to automatically debit from the customer's NPR wallet balance.
    Body: { amount (int, smallest unit), currency, customer_id?, wallet_id?, description? }
    """
    data = request.get_json(force=True)
    missing = [f for f in ["amount", "currency"] if f not in data]
    if missing:
        return jsonify(error=f"Missing fields: {', '.join(missing)}", code="validation_error"), 400
    amount = data["amount"]
    if not isinstance(amount, int) or amount <= 0:
        return jsonify(error="Amount must be a positive integer", code="invalid_amount"), 400

    payment_id = "pay_" + str(uuid.uuid4()).replace("-", "")[:20]
    status     = "succeeded" if amount <= 999999 else "failed"
    wallet_txn = None
    now        = now_iso()

    if data.get("wallet_id") and status == "succeeded":
        ok, wdata = wallet_debit(data["wallet_id"], amount, payment_id, data.get("description", ""))
        if not ok:
            return jsonify(error="Wallet debit failed: " + wdata.get("error", "unknown"), code=wdata.get("code", "wallet_error"), details=wdata), 400
        wallet_txn = wdata.get("txn_id")

    db = get_db()
    db.payments.insert_one({"id": payment_id, "customer_id": data.get("customer_id"), "wallet_id": data.get("wallet_id"), "wallet_txn_id": wallet_txn, "amount": amount, "currency": data["currency"].upper(), "status": status, "payment_method": data.get("payment_method"), "description": data.get("description"), "metadata": data.get("metadata", {}), "refunded_amount": 0, "created_at": now, "updated_at": now})
    return jsonify(clean_doc(db.payments.find_one({"id": payment_id}))), 201

@app.get("/api/payments/<payment_id>")
@require_api_key
def get_payment(payment_id):
    db = get_db(); payment = db.payments.find_one({"id": payment_id})
    if not payment: return jsonify(error="Payment not found", code="not_found"), 404
    payment = clean_doc(payment)
    if payment.get("customer_id"):
        c = db.customers.find_one({"id": payment["customer_id"]})
        if c: payment["customer_name"] = c.get("name"); payment["customer_email"] = c.get("email")
    return jsonify(payment)

@app.post("/api/payments/<payment_id>/cancel")
@require_api_key
def cancel_payment(payment_id):
    db = get_db(); payment = db.payments.find_one({"id": payment_id})
    if not payment: return jsonify(error="Payment not found", code="not_found"), 404
    if payment["status"] not in ("pending", "processing"):
        return jsonify(error=f"Cannot cancel payment with status '{payment['status']}'", code="invalid_status"), 400
    db.payments.update_one({"id": payment_id}, {"$set": {"status": "cancelled", "updated_at": now_iso()}})
    return jsonify(clean_doc(db.payments.find_one({"id": payment_id})))

# ─── Refunds ──────────────────────────────────────────────────────────────────
@app.post("/api/refunds")
@require_api_key
def create_refund():
    """
    Refund a payment. If a wallet_id was on the original payment,
    the refund amount is automatically credited back to the wallet.
    """
    data = request.get_json(force=True)
    if "payment_id" not in data:
        return jsonify(error="payment_id is required", code="validation_error"), 400
    db = get_db(); payment = db.payments.find_one({"id": data["payment_id"]})
    if not payment: return jsonify(error="Payment not found", code="not_found"), 404
    if payment["status"] != "succeeded": return jsonify(error="Only succeeded payments can be refunded", code="invalid_status"), 400
    refunded_amount = payment.get("refunded_amount", 0)
    refund_amount   = data.get("amount", payment["amount"] - refunded_amount)
    max_refundable  = payment["amount"] - refunded_amount
    if refund_amount > max_refundable:
        return jsonify(error=f"Refund exceeds refundable amount ({max_refundable})", code="exceeds_refund_limit"), 400
    refund_id = "re_" + str(uuid.uuid4()).replace("-", "")[:20]
    now = now_iso(); wallet_txn = None
    if payment.get("wallet_id"):
        ok, wdata = wallet_credit(payment["wallet_id"], refund_amount, data["payment_id"], "refund")
        if ok: wallet_txn = wdata.get("txn_id")
    db.refunds.insert_one({"id": refund_id, "payment_id": data["payment_id"], "amount": refund_amount, "reason": data.get("reason"), "status": "succeeded", "wallet_txn_id": wallet_txn, "created_at": now})
    new_refunded = refunded_amount + refund_amount
    new_status   = "refunded" if new_refunded >= payment["amount"] else "succeeded"
    db.payments.update_one({"id": data["payment_id"]}, {"$set": {"refunded_amount": new_refunded, "status": new_status, "updated_at": now}})
    return jsonify(clean_doc(db.refunds.find_one({"id": refund_id}))), 201

@app.get("/api/refunds")
@require_api_key
def list_refunds():
    db = get_db(); qf = {}
    if request.args.get("payment_id"): qf["payment_id"] = request.args.get("payment_id")
    refunds = list(db.refunds.find(qf).sort("created_at", DESCENDING))
    result  = []
    for r in refunds:
        r = clean_doc(r)
        p = db.payments.find_one({"id": r["payment_id"]})
        if p: r["currency"] = p.get("currency")
        result.append(r)
    return jsonify({"data": result})

# ─── Customers ────────────────────────────────────────────────────────────────
@app.get("/api/customers")
@require_api_key
def list_customers():
    db = get_db(); page, per_page = int(request.args.get("page", 1)), min(int(request.args.get("per_page", 20)), 100)
    return jsonify(paginate_collection(db.customers, {}, "created_at", page, per_page))

@app.post("/api/customers")
@require_api_key
def create_customer():
    data = request.get_json(force=True)
    if not data.get("name") or not data.get("email"):
        return jsonify(error="name and email are required", code="validation_error"), 400
    cid = "cus_" + str(uuid.uuid4()).replace("-", "")[:16]; now = now_iso(); db = get_db()
    try:
        db.customers.insert_one({"id": cid, "name": data["name"], "email": data["email"], "phone": data.get("phone"), "metadata": data.get("metadata", {}), "wallet_id": data.get("wallet_id"), "created_at": now, "updated_at": now})
    except DuplicateKeyError:
        return jsonify(error="Email already exists", code="duplicate_email"), 409
    return jsonify(clean_doc(db.customers.find_one({"id": cid}))), 201

@app.get("/api/customers/<customer_id>")
@require_api_key
def get_customer(customer_id):
    db = get_db(); customer = db.customers.find_one({"id": customer_id})
    if not customer: return jsonify(error="Customer not found", code="not_found"), 404
    customer = clean_doc(customer)
    customer["recent_payments"] = [clean_doc(p) for p in db.payments.find({"customer_id": customer_id}).sort("created_at", DESCENDING).limit(5)]
    return jsonify(customer)

@app.patch("/api/customers/<customer_id>")
@require_api_key
def update_customer(customer_id):
    db = get_db(); customer = db.customers.find_one({"id": customer_id})
    if not customer: return jsonify(error="Customer not found", code="not_found"), 404
    data    = request.get_json(force=True)
    updates = {k: data[k] for k in {"name", "email", "phone", "metadata", "wallet_id"} if k in data}
    if not updates: return jsonify(error="No valid fields to update", code="validation_error"), 400
    updates["updated_at"] = now_iso()
    db.customers.update_one({"id": customer_id}, {"$set": updates})
    return jsonify(clean_doc(db.customers.find_one({"id": customer_id})))

# ─── Payment Methods ──────────────────────────────────────────────────────────
@app.post("/api/payment-methods")
@require_api_key
def create_payment_method():
    data = request.get_json(force=True)
    missing = [f for f in ["customer_id", "type", "last4"] if f not in data]
    if missing: return jsonify(error=f"Missing: {', '.join(missing)}", code="validation_error"), 400
    db = get_db()
    if not db.customers.find_one({"id": data["customer_id"]}): return jsonify(error="Customer not found", code="not_found"), 404
    pm_id = "pm_" + str(uuid.uuid4()).replace("-", "")[:16]; now = now_iso()
    db.payment_methods.insert_one({"id": pm_id, "customer_id": data["customer_id"], "type": data["type"], "last4": data["last4"], "brand": data.get("brand"), "exp_month": data.get("exp_month"), "exp_year": data.get("exp_year"), "is_default": data.get("is_default", 0), "created_at": now})
    return jsonify(clean_doc(db.payment_methods.find_one({"id": pm_id}))), 201

@app.get("/api/payment-methods")
@require_api_key
def list_payment_methods():
    db = get_db(); qf = {}
    if request.args.get("customer_id"): qf["customer_id"] = request.args.get("customer_id")
    return jsonify({"data": [clean_doc(p) for p in db.payment_methods.find(qf).sort("created_at", DESCENDING)]})

# ─── Analytics ────────────────────────────────────────────────────────────────
@app.get("/api/analytics")
@require_api_key
def analytics():
    db = get_db(); all_payments = list(db.payments.find({}))
    succeeded = [p for p in all_payments if p.get("status") == "succeeded"]
    failed    = [p for p in all_payments if p.get("status") == "failed"]
    pending   = [p for p in all_payments if p.get("status") == "pending"]
    refunded  = [p for p in all_payments if p.get("status") == "refunded"]
    total_volume = sum(p["amount"] for p in succeeded)
    summary = {"total_payments": len(all_payments), "succeeded": len(succeeded), "failed": len(failed), "pending": len(pending), "refunded": len(refunded), "total_volume": total_volume, "total_refunded": sum(p.get("refunded_amount", 0) for p in all_payments), "avg_payment": (total_volume / len(succeeded)) if succeeded else 0, "wallet_backed": len([p for p in all_payments if p.get("wallet_id")])}
    currency_map = {}
    for p in all_payments:
        cur = p.get("currency", "UNKNOWN")
        if cur not in currency_map: currency_map[cur] = {"currency": cur, "count": 0, "volume": 0}
        currency_map[cur]["count"] += 1
        if p.get("status") == "succeeded": currency_map[cur]["volume"] += p["amount"]
    cutoff = datetime.now(timezone.utc) - timedelta(days=30); daily_map = {}
    for p in all_payments:
        try:
            dt = datetime.fromisoformat(p["created_at"])
            if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
            if dt < cutoff: continue
            d = dt.date().isoformat()
            if d not in daily_map: daily_map[d] = {"date": d, "count": 0, "volume": 0}
            daily_map[d]["count"] += 1
            if p.get("status") == "succeeded": daily_map[d]["volume"] += p["amount"]
        except: continue
    all_customers = list(db.customers.find({}))
    top_customers = sorted([{"name": c.get("name"), "email": c.get("email"), "wallet_id": c.get("wallet_id"), "payment_count": len([p for p in all_payments if p.get("customer_id") == c.get("id")]), "total_spent": sum(p["amount"] for p in all_payments if p.get("customer_id") == c.get("id") and p.get("status") == "succeeded")} for c in all_customers], key=lambda x: x["total_spent"], reverse=True)[:5]
    return jsonify({"summary": summary, "by_currency": list(currency_map.values()), "daily_volume": sorted(daily_map.values(), key=lambda x: x["date"]), "top_customers": top_customers})

# ─── Error Handlers ───────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"): return jsonify(error="Endpoint not found", code="not_found"), 404
    return jsonify({"message": "Payment API running."}), 200

@app.errorhandler(405)
def method_not_allowed(e): return jsonify(error="Method not allowed", code="method_not_allowed"), 405

@app.errorhandler(500)
def internal_error(e): return jsonify(error="Internal server error", code="internal_error"), 500

# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        init_db()
    port = int(os.environ.get("PORT", 8080))
    print(f"\n🚀 Payment API  →  http://localhost:{port}")
    print(f"🔑 Demo Key     →  pk_test_demo1234567890abcdef")
    print(f"🔗 Wallet API   →  {WALLET_API_URL}")
    print(f"📡 API Root     →  http://localhost:{port}/api\n")
    app.run(host="0.0.0.0", port=port, debug=True)
