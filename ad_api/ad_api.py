"""
E-Commerce Ad Post API
======================
Single-file FastAPI + MongoDB backend for posting product ads.

Install dependencies:
    pip install fastapi uvicorn motor pydantic[email]

Run:
    uvicorn ad_api:app --reload
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

import uvicorn
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

MONGO_URI = "mongodb+srv://rajkarnikar:redhonda_2265@cluster0.oe5udmu.mongodb.net/"          # ← Paste your MongoDB URI here
DB_NAME   = "ecommerce"
PORT      = 8000


# ─────────────────────────────────────────────────────────────────────────────
# APP & DB SETUP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="E-Commerce Ad API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Motor async MongoDB client (initialized on startup)
db = None

@app.on_event("startup")
async def connect_db():
    global db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    # Indexes for faster queries
    await db.ads.create_index([("category", 1), ("status", 1)])
    await db.ads.create_index([("created_at", -1)])
    print("✅ MongoDB connected")

@app.on_event("shutdown")
async def disconnect_db():
    db.client.close()
    print("🔌 MongoDB disconnected")


# ─────────────────────────────────────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────────────────────────────────────

class Category(str, Enum):
    electronics  = "electronics"
    fashion      = "fashion"
    furniture    = "furniture"
    vehicles     = "vehicles"
    real_estate  = "real-estate"
    services     = "services"
    jobs         = "jobs"
    other        = "other"

class Currency(str, Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    NPR = "NPR"
    INR = "INR"

class AdStatus(str, Enum):
    active  = "active"
    sold    = "sold"
    expired = "expired"
    pending = "pending"


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS  (Pydantic models)
# ─────────────────────────────────────────────────────────────────────────────

class Price(BaseModel):
    amount:        float    = Field(..., ge=0, description="Price must be >= 0")
    currency:      Currency = Currency.USD
    is_negotiable: bool     = False

class Location(BaseModel):
    city:    Optional[str] = None
    country: Optional[str] = "Nepal"

class Seller(BaseModel):
    name:  str            = Field(..., min_length=2)
    email: EmailStr
    phone: Optional[str]  = None

class AdIn(BaseModel):
    """Payload the client sends to POST /ads"""
    title:       str            = Field(..., min_length=3,  max_length=100)
    description: str            = Field(..., min_length=10, max_length=2000)
    price:       Price
    category:    Category
    location:    Optional[Location] = None
    images:      list[str]          = Field(default=[], max_length=10)
    seller:      Seller

    @field_validator("images")
    @classmethod
    def max_ten_images(cls, v):
        if len(v) > 10:
            raise ValueError("Maximum 10 images allowed")
        return v

class AdOut(AdIn):
    """What the API returns — adds server-generated fields"""
    id:         str
    status:     AdStatus  = AdStatus.active
    views:      int       = 0
    created_at: datetime
    expires_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def serialize(doc: dict) -> dict:
    """Convert MongoDB _id → id string so Pydantic is happy."""
    doc["id"] = str(doc.pop("_id"))
    return doc


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "OK", "timestamp": datetime.utcnow()}


# ── POST /ads ─────────────────────────────────────────────────────────────────
@app.post("/ads", response_model=dict, status_code=201, tags=["Ads"])
async def create_ad(payload: AdIn):
    """Post a new product ad. Shows up in the product section immediately."""

    doc = payload.model_dump()
    doc["status"]     = AdStatus.active
    doc["views"]      = 0
    doc["created_at"] = datetime.utcnow()
    doc["expires_at"] = datetime.utcnow() + timedelta(days=30)

    result = await db.ads.insert_one(doc)
    created = await db.ads.find_one({"_id": result.inserted_id})

    return {
        "success": True,
        "message": "Ad posted successfully",
        "data":    serialize(created),
    }


# ── GET /ads ──────────────────────────────────────────────────────────────────
@app.get("/ads", response_model=dict, tags=["Ads"])
async def get_ads(
    category: Optional[Category] = Query(None, description="Filter by category"),
    page:     int                 = Query(1,    ge=1),
    limit:    int                 = Query(20,   ge=1, le=100),
):
    """Fetch all active ads for the product section (paginated)."""

    query = {"status": AdStatus.active}
    if category:
        query["category"] = category

    skip  = (page - 1) * limit
    total = await db.ads.count_documents(query)
    cursor = db.ads.find(query).sort("created_at", -1).skip(skip).limit(limit)
    ads = [serialize(doc) async for doc in cursor]

    return {
        "success": True,
        "data": ads,
        "pagination": {
            "total":       total,
            "page":        page,
            "limit":       limit,
            "total_pages": -(-total // limit),   # ceiling division
        },
    }


# ── GET /ads/{id} ─────────────────────────────────────────────────────────────
@app.get("/ads/{ad_id}", response_model=dict, tags=["Ads"])
async def get_ad(ad_id: str):
    """Fetch a single ad and increment its view count."""

    try:
        oid = ObjectId(ad_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ad ID format")

    ad = await db.ads.find_one_and_update(
        {"_id": oid},
        {"$inc": {"views": 1}},
        return_document=True,
    )

    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")

    return {"success": True, "data": serialize(ad)}


# ─────────────────────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("ad_api:app", host="0.0.0.0", port=PORT, reload=True)
