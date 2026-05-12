from datetime import datetime, timedelta
from typing import List, Optional
from enum import Enum

import uvicorn
from bson import ObjectId
from fastapi import (
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    Header,
)
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field


# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

MONGO_URI = "YOUR_MONGODB_URI"
DB_NAME = "ecommerce"

SECRET_KEY = "SUPER_SECRET_KEY"
ALGORITHM = "HS256"

app = FastAPI(title="Marketplace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

db = None

pwd_context = CryptContext(schemes=["bcrypt"])


@app.on_event("startup")
async def startup():
    global db

    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    await db.users.create_index([("email", 1)], unique=True)
    await db.ads.create_index([("created_at", -1)])

    print("MongoDB connected")


# ─────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────

class Category(str, Enum):
    laptop = "laptop"
    furniture = "furniture"
    books = "books"


# ─────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AdCreate(BaseModel):
    name: str
    description: str
    category: Category
    price: float
    tags: List[str] = Field(..., min_length=3)


# ─────────────────────────────────────────────
# JWT HELPERS
# ─────────────────────────────────────────────

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)


def create_access_token(data: dict):
    payload = data.copy()

    expire = datetime.utcnow() + timedelta(days=7)

    payload.update({"exp": expire})

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(authorization: Optional[str] = Header(None)):

    if not authorization:
        raise HTTPException(401, "Missing token")

    try:
        token = authorization.replace("Bearer ", "")

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        user = await db.users.find_one({
            "_id": ObjectId(user_id)
        })

        if not user:
            raise HTTPException(401, "Invalid token")

        return user

    except JWTError:
        raise HTTPException(401, "Invalid token")


# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────

@app.post("/register")
async def register(user: UserRegister):

    existing = await db.users.find_one({
        "email": user.email
    })

    if existing:
        raise HTTPException(400, "Email already exists")

    doc = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "saved_ads": [],
    }

    result = await db.users.insert_one(doc)

    return {
        "success": True,
        "user_id": str(result.inserted_id)
    }


@app.post("/login")
async def login(user: UserLogin):

    existing = await db.users.find_one({
        "email": user.email
    })

    if not existing:
        raise HTTPException(401, "Invalid credentials")

    if not verify_password(
        user.password,
        existing["password"]
    ):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({
        "user_id": str(existing["_id"])
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ─────────────────────────────────────────────
# FRAUD DETECTION
# ─────────────────────────────────────────────

SCAM_WORDS = [
    "pay first",
    "crypto only",
    "western union",
    "urgent sale"
]


def detect_fraud(description: str, price: float):

    text = description.lower()

    for word in SCAM_WORDS:
        if word in text:
            return True

    if price < 10:
        return True

    return False


# ─────────────────────────────────────────────
# CREATE AD
# ─────────────────────────────────────────────

@app.post("/ads")
async def create_ad(
    payload: AdCreate,
    current_user=Depends(get_current_user)
):

    fraud_detected = detect_fraud(
        payload.description,
        payload.price
    )

    ad = {
        "name": payload.name,
        "description": payload.description,
        "category": payload.category,
        "price": payload.price,
        "tags": payload.tags,
        "seller_id": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "fraud_flag": fraud_detected,
    }

    result = await db.ads.insert_one(ad)

    # realtime notification
    message = f"New ad posted: {payload.name}"

    for connection in active_connections:
        await connection.send_text(message)

    return {
        "success": True,
        "ad_id": str(result.inserted_id),
        "fraud_flag": fraud_detected
    }


# ─────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────

@app.post("/ads/{ad_id}/save")
async def save_ad(
    ad_id: str,
    current_user=Depends(get_current_user)
):

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"saved_ads": ad_id}}
    )

    return {
        "success": True,
        "message": "Ad saved"
    }


@app.get("/favorites")
async def get_favorites(
    current_user=Depends(get_current_user)
):

    user = await db.users.find_one({
        "_id": current_user["_id"]
    })

    saved_ads = user.get("saved_ads", [])

    ads = []

    for ad_id in saved_ads:

        try:
            ad = await db.ads.find_one({
                "_id": ObjectId(ad_id)
            })

            if ad:
                ad["id"] = str(ad["_id"])
                del ad["_id"]

                ads.append(ad)

        except:
            pass

    return {
        "success": True,
        "favorites": ads
    }


# ─────────────────────────────────────────────
# WEBSOCKET NOTIFICATIONS
# ─────────────────────────────────────────────

active_connections = []


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    active_connections.append(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:

        active_connections.remove(websocket)


# ─────────────────────────────────────────────
# PUSH NOTIFICATION PLACEHOLDER
# ─────────────────────────────────────────────

async def send_push_notification(
    user_id: str,
    title: str,
    body: str
):
    """
    Integrate Firebase FCM here later.
    """

    print(f"Push notification → {title}: {body}")


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────

@app.get("/health")
async def health():

    return {
        "status": "OK",
        "time": datetime.utcnow()
    }


# ─────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────

if __name__ == "__main__":

    uvicorn.run(
        "marketplace_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
