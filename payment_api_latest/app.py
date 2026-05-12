"""
Payment API System - Flask + MongoDB Backend
Fully working REST API with database persistence
"""
from pymongo import MongoClient, DESCENDING
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv
import uuid
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
import certifi

load_dotenv()

# ─── App Setup ────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend", "public")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
API_KEY_HEADER = "X-API-Key"

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ─── MongoDB Setup ────────────────────────────────────────────────────────────
try:
    client = MongoClient(os.getenv("MONGO_URI"), tls=True, tlsAllowInvalidCertificates=True)
    client.admin.command("ping")
    print("✅ MongoDB Atlas Connected")
except Exception as e:
    print("❌ MongoDB Connection Failed:", e)


def get_db():
    client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
    return client["payments_db"]


def init_db():
    db = get_db()

    # Create unique indexes
    db.customers.create_index("email", unique=True)
    db.api_keys.create_index("key_hash", unique=True)

    # Seed demo API key
    if db.api_keys.count_documents({}) == 0:
        raw_key = "pk_test_demo1234567890abcdef"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        db.api_keys.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Demo Key",
            "key_hash": key_hash,
            "key_prefix": "pk_test_demo",
            "is_active": 1,
            "created_at": now_iso()
        })

    # Seed customers
    if db.customers.count_documents({}) == 0:
        demo_customers = [
            {
                "id": str(uuid.uuid4()),
                "name": "Alice Johnson",
                "email": "alice@example.com",
                "phone": "+1-555-0101",
                "created_at": now_iso(),
                "updated_at": now_iso()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Bob Martinez",
                "email": "bob@example.com",
                "phone": "+1-555-0102",
                "created_at": now_iso(),
                "updated_at": now_iso()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Carol Williams",
                "email": "carol@example.com",
                "phone": "+1-555-0103",
                "created_at": now_iso(),
                "updated_at": now_iso()
            }
        ]
        db.customers.insert_many(demo_customers)

    print("✅ MongoDB Collections Initialised")

# ─── Auth ──────────────────────────────────────────────────────────────────────
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get(API_KEY_HEADER) or request.args.get("api_key")
        # For demo, accept the demo key directly
        if key == "pk_test_demo1234567890abcdef":
            return f(*args, **kwargs)
        if not key:
            return jsonify(error="Missing API key", code="auth_required"), 401
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        db = get_db()
        row = db.api_keys.find_one({"key_hash": key_hash, "is_active": 1})
        if not row:
            return jsonify(error="Invalid or inactive API key", code="invalid_api_key"), 401
        return f(*args, **kwargs)
    return decorated

# ─── Helpers ───────────────────────────────────────────────────────────────────
def clean_doc(doc):
    """Convert MongoDB document to JSON-safe dict."""
    if doc is None:
        return None
    doc = dict(doc)
    doc.pop("_id", None)  # remove ObjectId field
    return doc

def paginate_collection(collection, query_filter, sort_field, page=1, per_page=20):
    total = collection.count_documents(query_filter)
    offset = (page - 1) * per_page
    rows = list(
        collection.find(query_filter)
        .sort(sort_field, DESCENDING)
        .skip(offset)
        .limit(per_page)
    )
    return {
        "data": [clean_doc(r) for r in rows],
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    }

def now_iso():
    return datetime.now(timezone.utc).isoformat()

# ─── Routes: Frontend ──────────────────────────────────────────────────────────
@app.route("/")
@app.route("/dashboard")
def index():
    if os.path.exists(os.path.join(FRONTEND_DIR, "index.html")):
        return send_from_directory(FRONTEND_DIR, "index.html")
    return jsonify({"message": "Payment API is running. Use /api endpoints."}), 200

# ─── Routes: API Info ──────────────────────────────────────────────────────────
@app.get("/api")
def api_info():
    return jsonify({
        "name": "Payment API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "payments":        "/api/payments",
            "customers":       "/api/customers",
            "payment_methods": "/api/payment-methods",
            "refunds":         "/api/refunds",
            "analytics":       "/api/analytics"
        },
        "auth": f"Pass your API key in the {API_KEY_HEADER} header",
        "demo_key": "pk_test_demo1234567890abcdef"
    })

# ─── Routes: Payments ──────────────────────────────────────────────────────────
@app.get("/api/payments")
@require_api_key
def list_payments():
    db = get_db()
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)
    status = request.args.get("status")
    customer_id = request.args.get("customer_id")
    currency = request.args.get("currency", "").upper()

    query_filter = {}
    if status:      query_filter["status"] = status
    if customer_id: query_filter["customer_id"] = customer_id
    if currency:    query_filter["currency"] = currency

    total = db.payments.count_documents(query_filter)
    offset = (page - 1) * per_page
    payments = list(
        db.payments.find(query_filter)
        .sort("created_at", DESCENDING)
        .skip(offset)
        .limit(per_page)
    )

    # Enrich with customer info
    result_data = []
    for p in payments:
        p = clean_doc(p)
        if p.get("customer_id"):
            customer = db.customers.find_one({"id": p["customer_id"]})
            if customer:
                p["customer_name"] = customer.get("name")
                p["customer_email"] = customer.get("email")
        result_data.append(p)

    return jsonify({
        "data": result_data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    })

@app.post("/api/payments")
@require_api_key
def create_payment():
    data = request.get_json(force=True)
    required = ["amount", "currency"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify(error=f"Missing fields: {', '.join(missing)}", code="validation_error"), 400

    amount = data["amount"]
    if not isinstance(amount, int) or amount <= 0:
        return jsonify(error="Amount must be a positive integer (in smallest currency unit)", code="invalid_amount"), 400

    payment_id = "pay_" + str(uuid.uuid4()).replace("-", "")[:20]
    now = now_iso()
    status = "succeeded"
    if amount > 999999:
        status = "failed"

    db = get_db()
    payment_doc = {
        "id": payment_id,
        "customer_id": data.get("customer_id"),
        "amount": amount,
        "currency": data["currency"].upper(),
        "status": status,
        "payment_method": data.get("payment_method"),
        "description": data.get("description"),
        "metadata": data.get("metadata", {}),
        "refunded_amount": 0,
        "created_at": now,
        "updated_at": now
    }
    db.payments.insert_one(payment_doc)

    payment = clean_doc(db.payments.find_one({"id": payment_id}))
    return jsonify(payment), 201

@app.get("/api/payments/<payment_id>")
@require_api_key
def get_payment(payment_id):
    db = get_db()
    payment = db.payments.find_one({"id": payment_id})
    if not payment:
        return jsonify(error="Payment not found", code="not_found"), 404
    payment = clean_doc(payment)
    if payment.get("customer_id"):
        customer = db.customers.find_one({"id": payment["customer_id"]})
        if customer:
            payment["customer_name"] = customer.get("name")
            payment["customer_email"] = customer.get("email")
    return jsonify(payment)

@app.post("/api/payments/<payment_id>/cancel")
@require_api_key
def cancel_payment(payment_id):
    db = get_db()
    payment = db.payments.find_one({"id": payment_id})
    if not payment:
        return jsonify(error="Payment not found", code="not_found"), 404
    if payment["status"] not in ("pending", "processing"):
        return jsonify(error=f"Cannot cancel payment with status '{payment['status']}'", code="invalid_status"), 400
    db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "cancelled", "updated_at": now_iso()}}
    )
    return jsonify(clean_doc(db.payments.find_one({"id": payment_id})))

# ─── Routes: Refunds ───────────────────────────────────────────────────────────
@app.post("/api/refunds")
@require_api_key
def create_refund():
    data = request.get_json(force=True)
    if "payment_id" not in data:
        return jsonify(error="payment_id is required", code="validation_error"), 400

    db = get_db()
    payment = db.payments.find_one({"id": data["payment_id"]})
    if not payment:
        return jsonify(error="Payment not found", code="not_found"), 404
    if payment["status"] != "succeeded":
        return jsonify(error="Only succeeded payments can be refunded", code="invalid_status"), 400

    refunded_amount = payment.get("refunded_amount", 0)
    refund_amount = data.get("amount", payment["amount"] - refunded_amount)
    max_refundable = payment["amount"] - refunded_amount
    if refund_amount > max_refundable:
        return jsonify(error=f"Refund amount exceeds refundable amount ({max_refundable})", code="exceeds_refund_limit"), 400

    refund_id = "re_" + str(uuid.uuid4()).replace("-", "")[:20]
    now = now_iso()

    db.refunds.insert_one({
        "id": refund_id,
        "payment_id": data["payment_id"],
        "amount": refund_amount,
        "reason": data.get("reason"),
        "status": "succeeded",
        "created_at": now
    })

    new_refunded = refunded_amount + refund_amount
    new_status = "refunded" if new_refunded >= payment["amount"] else "succeeded"
    db.payments.update_one(
        {"id": data["payment_id"]},
        {"$set": {"refunded_amount": new_refunded, "status": new_status, "updated_at": now}}
    )

    refund = clean_doc(db.refunds.find_one({"id": refund_id}))
    return jsonify(refund), 201

@app.get("/api/refunds")
@require_api_key
def list_refunds():
    db = get_db()
    payment_id = request.args.get("payment_id")
    query_filter = {}
    if payment_id:
        query_filter["payment_id"] = payment_id

    refunds = list(db.refunds.find(query_filter).sort("created_at", DESCENDING))
    result = []
    for r in refunds:
        r = clean_doc(r)
        payment = db.payments.find_one({"id": r["payment_id"]})
        if payment:
            r["currency"] = payment.get("currency")
        result.append(r)
    return jsonify({"data": result})

# ─── Routes: Customers ─────────────────────────────────────────────────────────
@app.get("/api/customers")
@require_api_key
def list_customers():
    db = get_db()
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)
    result = paginate_collection(db.customers, {}, "created_at", page, per_page)
    return jsonify(result)

@app.post("/api/customers")
@require_api_key
def create_customer():
    data = request.get_json(force=True)
    if not data.get("name") or not data.get("email"):
        return jsonify(error="name and email are required", code="validation_error"), 400
    cid = "cus_" + str(uuid.uuid4()).replace("-", "")[:16]
    now = now_iso()
    db = get_db()
    try:
        db.customers.insert_one({
            "id": cid,
            "name": data["name"],
            "email": data["email"],
            "phone": data.get("phone"),
            "metadata": data.get("metadata", {}),
            "created_at": now,
            "updated_at": now
        })
    except DuplicateKeyError:
        return jsonify(error="Email already exists", code="duplicate_email"), 409
    customer = clean_doc(db.customers.find_one({"id": cid}))
    return jsonify(customer), 201

@app.get("/api/customers/<customer_id>")
@require_api_key
def get_customer(customer_id):
    db = get_db()
    customer = db.customers.find_one({"id": customer_id})
    if not customer:
        return jsonify(error="Customer not found", code="not_found"), 404
    customer = clean_doc(customer)
    payments = list(
        db.payments.find({"customer_id": customer_id})
        .sort("created_at", DESCENDING)
        .limit(5)
    )
    customer["recent_payments"] = [clean_doc(p) for p in payments]
    return jsonify(customer)

@app.patch("/api/customers/<customer_id>")
@require_api_key
def update_customer(customer_id):
    db = get_db()
    customer = db.customers.find_one({"id": customer_id})
    if not customer:
        return jsonify(error="Customer not found", code="not_found"), 404
    data = request.get_json(force=True)
    allowed = {"name", "email", "phone", "metadata"}
    updates = {}
    for k in allowed:
        if k in data:
            updates[k] = data[k]
    if not updates:
        return jsonify(error="No valid fields to update", code="validation_error"), 400
    updates["updated_at"] = now_iso()
    db.customers.update_one({"id": customer_id}, {"$set": updates})
    return jsonify(clean_doc(db.customers.find_one({"id": customer_id})))

# ─── Routes: Analytics ─────────────────────────────────────────────────────────
@app.get("/api/analytics")
@require_api_key
def analytics():
    db = get_db()
    all_payments = list(db.payments.find({}))

    total_payments = len(all_payments)
    succeeded = [p for p in all_payments if p.get("status") == "succeeded"]
    failed    = [p for p in all_payments if p.get("status") == "failed"]
    pending   = [p for p in all_payments if p.get("status") == "pending"]
    refunded  = [p for p in all_payments if p.get("status") == "refunded"]

    total_volume   = sum(p["amount"] for p in succeeded)
    total_refunded = sum(p.get("refunded_amount", 0) for p in all_payments)
    avg_payment    = (total_volume / len(succeeded)) if succeeded else 0

    summary = {
        "total_payments": total_payments,
        "succeeded":      len(succeeded),
        "failed":         len(failed),
        "pending":        len(pending),
        "refunded":       len(refunded),
        "total_volume":   total_volume,
        "total_refunded": total_refunded,
        "avg_payment":    avg_payment
    }

    # By currency
    currency_map = {}
    for p in all_payments:
        cur = p.get("currency", "UNKNOWN")
        if cur not in currency_map:
            currency_map[cur] = {"currency": cur, "count": 0, "volume": 0}
        currency_map[cur]["count"] += 1
        if p.get("status") == "succeeded":
            currency_map[cur]["volume"] += p["amount"]
    by_currency = list(currency_map.values())

    # Daily volume (last 30 days)
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    daily_map = {}
    for p in all_payments:
        try:
            dt = datetime.fromisoformat(p["created_at"])
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if dt < cutoff:
                continue
            date_str = dt.date().isoformat()
            if date_str not in daily_map:
                daily_map[date_str] = {"date": date_str, "count": 0, "volume": 0}
            daily_map[date_str]["count"] += 1
            if p.get("status") == "succeeded":
                daily_map[date_str]["volume"] += p["amount"]
        except Exception:
            continue
    daily_volume = sorted(daily_map.values(), key=lambda x: x["date"])

    # Top customers
    all_customers = list(db.customers.find({}))
    customer_stats = []
    for c in all_customers:
        c_payments = [p for p in all_payments if p.get("customer_id") == c.get("id")]
        total_spent = sum(p["amount"] for p in c_payments if p.get("status") == "succeeded")
        customer_stats.append({
            "name": c.get("name"),
            "email": c.get("email"),
            "payment_count": len(c_payments),
            "total_spent": total_spent
        })
    top_customers = sorted(customer_stats, key=lambda x: x["total_spent"], reverse=True)[:5]

    return jsonify({
        "summary": summary,
        "by_currency": by_currency,
        "daily_volume": daily_volume,
        "top_customers": top_customers
    })

# ─── Routes: Payment Methods ───────────────────────────────────────────────────
@app.post("/api/payment-methods")
@require_api_key
def create_payment_method():
    data = request.get_json(force=True)
    required = ["customer_id", "type", "last4"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify(error=f"Missing: {', '.join(missing)}", code="validation_error"), 400
    db = get_db()
    if not db.customers.find_one({"id": data["customer_id"]}):
        return jsonify(error="Customer not found", code="not_found"), 404
    pm_id = "pm_" + str(uuid.uuid4()).replace("-", "")[:16]
    now = now_iso()
    db.payment_methods.insert_one({
        "id": pm_id,
        "customer_id": data["customer_id"],
        "type": data["type"],
        "last4": data["last4"],
        "brand": data.get("brand"),
        "exp_month": data.get("exp_month"),
        "exp_year": data.get("exp_year"),
        "is_default": data.get("is_default", 0),
        "created_at": now
    })
    pm = clean_doc(db.payment_methods.find_one({"id": pm_id}))
    return jsonify(pm), 201

@app.get("/api/payment-methods")
@require_api_key
def list_payment_methods():
    db = get_db()
    customer_id = request.args.get("customer_id")
    query_filter = {}
    if customer_id:
        query_filter["customer_id"] = customer_id
    pms = list(db.payment_methods.find(query_filter).sort("created_at", DESCENDING))
    return jsonify({"data": [clean_doc(p) for p in pms]})

# ─── Error Handlers ────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify(error="Endpoint not found", code="not_found"), 404
    return jsonify({"message": "Payment API is running. Use /api endpoints."}), 200

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify(error="Method not allowed", code="method_not_allowed"), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Internal server error", code="internal_error"), 500

# ─── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        init_db()
    port = int(os.environ.get("PORT", 8080))
    print(f"\n🚀 Payment API running at http://localhost:{port}")
    print(f"🔑 Demo API Key: pk_test_demo1234567890abcdef")
    print(f"📊 Dashboard:    http://localhost:{port}/")
    print(f"📡 API Root:     http://localhost:{port}/api\n")
    app.run(host="0.0.0.0", port=port, debug=True)