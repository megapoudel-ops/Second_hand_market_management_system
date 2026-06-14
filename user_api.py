import os
import random
import string
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import uvicorn
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient

# ─────────────────────────────────────────────
# CONFIG  (keep in sync with ad_api_latest.py)
# ─────────────────────────────────────────────

# Best practice: Fallback to hardcoded string only if environment variable isn't set
MONGO_URI  = os.getenv("MONGO_URI", "mongodb+srv://rajkarnikar:redhonda_2265@cluster0.oe5udmu.mongodb.net/")
DB_NAME    = "ecommerce"
SECRET_KEY = "SUPER_SECRET_KEY"
ALGORITHM  = "HS256"

db = None

# ─────────────────────────────────────────────
# UNIQUE ID GENERATOR
# ─────────────────────────────────────────────

_ADJECTIVES = [
    "SWIFT", "BOLD", "CALM", "DARK", "EPIC",
    "FAIR", "GOLD", "HIGH", "IRON", "JADE",
    "KEEN", "LONE", "MUTE", "NEAT", "OPEN",
    "PALE", "RARE", "SAGE", "TALL", "VAST",
    "WILD", "ZEAL", "BLUE", "PURE", "WARM",
]

_NOUNS = [
    "EAGLE", "TIGER", "STORM", "RIVER", "FLAME",
    "STONE", "CLOUD", "NIGHT", "FROST", "BLADE",
    "RIDGE", "SPARK", "GROVE", "SHORE", "CRANE",
    "LUNAR", "CEDAR", "ATLAS", "HAVEN", "DRIFT",
    "EMBER", "CREEK", "BARON", "PIXEL", "SCOUT",
]


def _generate_unique_id() -> str:
    adj    = random.choice(_ADJECTIVES)
    noun   = random.choice(_NOUNS)
    digits = "".join(random.choices(string.digits, k=4))
    return f"USR-{adj}-{noun}-{digits}"


async def _ensure_unique_id(user: dict) -> str:
    if user.get("unique_id"):
        return user["unique_id"]

    for _ in range(10):
        candidate = _generate_unique_id()
        existing  = await db.users.find_one({"unique_id": candidate})
        if not existing:
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "unique_id"  : candidate,
                        "uid_created": datetime.now(timezone.utc),
                    }
                },
            )
            return candidate

    raise HTTPException(500, "Could not generate a unique ID – please retry")


def _public_profile(user: dict) -> dict:
    """Strip sensitive fields; return a clean public-safe dict."""
    # Fallback to MongoDB _id generation time if uid_created doesn't exist yet
    joined_at = user.get("uid_created") or user["_id"].generation_time
    
    return {
        "user_id"   : str(user["_id"]),
        "name"      : user.get("name", ""),
        "unique_id" : user.get("unique_id"),
        "joined_at" : joined_at,
        "ad_count"  : user.get("ad_count", 0),
        "avatar_url": user.get("avatar_url"),
        "bio"       : user.get("bio"),
    }


# ─────────────────────────────────────────────
# LIFESPAN
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]

    await db.users.create_index(
        [("unique_id", 1)],
        unique=True,
        sparse=True,
        name="unique_id_idx",
    )

    print("✅  UserAPI – MongoDB connected")
    yield
    client.close()
    print("🔌  UserAPI – MongoDB disconnected")


# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────

app = FastAPI(
    title       = "User / Unique-ID API",
    description = "Unique user ID generation, lookup, and public profile endpoints.",
    version     = "1.0.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)


# ─────────────────────────────────────────────
# AUTH HELPER
# ─────────────────────────────────────────────

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(401, "Missing token")
    try:
        token   = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(401, "Invalid token payload")
        user    = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(401, "Invalid token")
        return user
    except (JWTError, Exception):
        raise HTTPException(401, "Invalid token")


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.get("/api/user/unique-id", tags=["User"])
async def get_my_unique_id(current_user=Depends(get_current_user)):
    uid = await _ensure_unique_id(current_user)
    return {
        "success"   : True,
        "user_id"   : str(current_user["_id"]),
        "unique_id" : uid,
    }


@app.get("/api/user/search/{uniqueId}", tags=["User"])
async def search_by_unique_id(uniqueId: str):
    user = await db.users.find_one({"unique_id": uniqueId.upper()})
    if not user:
        raise HTTPException(404, f"No user found with unique ID '{uniqueId}'")
    return {
        "success": True,
        "user"   : _public_profile(user),
    }


@app.get("/api/user/{userId}", tags=["User"])
async def get_user_profile(userId: str):
    try:
        oid = ObjectId(userId)
    except Exception:
        raise HTTPException(400, f"'{userId}' is not a valid user ID format")

    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(404, f"User '{userId}' not found")

    return {
        "success": True,
        "user"   : _public_profile(user),
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status" : "OK",
        "service": "User / Unique-ID API",
        "time"   : datetime.now(timezone.utc),
    }


if __name__ == "__main__":
    uvicorn.run("user_api:app", host="0.0.0.0", port=8002, reload=True)