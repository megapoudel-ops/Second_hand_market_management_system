"""
media_upload_api.py
────────────────────────────────────────────────────────────────────────────
Media Upload API  ·  companion to ad_api_latest.py
────────────────────────────────────────────────────────────────────────────

Endpoints
─────────
POST /api/media/upload-image          Upload a single image for an ad
POST /api/media/upload-file           Upload any single file for an ad
POST /api/media/upload-folder         Upload multiple files as a "folder batch"
GET  /api/media/ad/{ad_id}            List all media attached to an ad (public)
GET  /api/media/file/{file_id}        Stream / download a file (public)
DELETE /api/media/file/{file_id}      Delete a file (owner only)

Storage
───────
Files are stored as GridFS chunks in the same MongoDB cluster used by
ad_api_latest.py.  No third-party bucket needed.

Relationship to ad_api_latest.py
─────────────────────────────────
  1. Call  POST /api/media/upload-image  (or upload-file / upload-folder)
     with the Bearer token from /login.  Receive { file_id, url }.
  2. Pass those URLs in the `media` list when you call POST /ads.
  3. GET /api/media/ad/{ad_id} returns every file attached to an ad for
     the public listing page.

────────────────────────────────────────────────────────────────────────────
"""

import io
import mimetypes
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional

import uvicorn
from bson import ObjectId
from fastapi import (
    FastAPI,
    File,
    Header,
    HTTPException,
    Query,
    UploadFile,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

# ─────────────────────────────────────────────
# CONFIG  (keep in sync with ad_api_latest.py)
# ─────────────────────────────────────────────

MONGO_URI   = os.getenv("MONGO_URI",   "mongodb+srv://rajkarnikar:redhonda_2265@cluster0.oe5udmu.mongodb.net/")
DB_NAME     = os.getenv("DB_NAME",     "ecommerce")
SECRET_KEY  = os.getenv("SECRET_KEY",  "SUPER_SECRET_KEY")
ALGORITHM   = "HS256"

# Maximum sizes
MAX_IMAGE_MB  = int(os.getenv("MAX_IMAGE_MB",  "10"))   # 10 MB per image
MAX_FILE_MB   = int(os.getenv("MAX_FILE_MB",   "50"))   # 50 MB per file
MAX_FOLDER_FILES = int(os.getenv("MAX_FOLDER_FILES", "20"))

ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "image/gif",  "image/bmp", "image/svg+xml",
}

# ─────────────────────────────────────────────
# GLOBALS
# ─────────────────────────────────────────────

db  = None
fs  = None          # GridFS bucket


# ─────────────────────────────────────────────
# LIFESPAN
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, fs

    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]
    fs     = AsyncIOMotorGridFSBucket(db, bucket_name="media")

    # Indexes for fast lookups
    await db.media_meta.create_index([("ad_id",      1)])
    await db.media_meta.create_index([("owner_id",   1)])
    await db.media_meta.create_index([("created_at", -1)])
    await db.media_meta.create_index([("file_id",    1)], unique=True)

    print("✅  MediaAPI – MongoDB + GridFS connected")
    yield
    client.close()
    print("🔌  MediaAPI – MongoDB disconnected")


# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────

app = FastAPI(
    title       = "Media Upload API",
    description = "GridFS-backed file/image upload companion for the Marketplace Ad API",
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
# AUTH HELPER  (mirrors ad_api_latest.py)
# ─────────────────────────────────────────────

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(401, "Missing token")
    try:
        token   = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        user    = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(401, "Invalid token")
        return user
    except JWTError:
        raise HTTPException(401, "Invalid token")


# ─────────────────────────────────────────────
# INTERNAL HELPERS
# ─────────────────────────────────────────────

def _bytes_to_mb(n: int) -> float:
    return n / (1024 * 1024)


async def _store_file(
    upload   : UploadFile,
    owner_id : str,
    ad_id    : Optional[str],
    max_mb   : float,
    allowed_types: Optional[set] = None,
) -> dict:
    """
    Reads an UploadFile, validates size & MIME type,
    stores in GridFS, and writes a metadata doc.
    Returns a dict with file_id and public URL.
    """

    # Read entire file into memory (GridFS streams in chunks internally)
    data = await upload.read()

    # ── Size guard ──────────────────────────────────────────────────────────
    if _bytes_to_mb(len(data)) > max_mb:
        raise HTTPException(
            413,
            f"File '{upload.filename}' exceeds {max_mb} MB limit "
            f"({_bytes_to_mb(len(data)):.1f} MB received)."
        )

    # ── MIME type guard ──────────────────────────────────────────────────────
    content_type = upload.content_type or (
        mimetypes.guess_type(upload.filename or "")[0] or "application/octet-stream"
    )
    if allowed_types and content_type not in allowed_types:
        raise HTTPException(
            415,
            f"'{content_type}' is not an accepted type. "
            f"Accepted: {sorted(allowed_types)}"
        )

    # ── Store in GridFS ──────────────────────────────────────────────────────
    file_id = await fs.upload_from_stream(
        upload.filename or "unnamed",
        io.BytesIO(data),
        metadata={
            "content_type" : content_type,
            "owner_id"     : owner_id,
            "ad_id"        : ad_id,
            "original_name": upload.filename,
        },
    )

    file_id_str = str(file_id)

    # ── Metadata doc (for fast listing without GridFS scans) ─────────────────
    meta = {
        "file_id"      : file_id_str,
        "owner_id"     : owner_id,
        "ad_id"        : ad_id,
        "filename"     : upload.filename,
        "content_type" : content_type,
        "size_bytes"   : len(data),
        "created_at"   : datetime.utcnow(),
        "public_url"   : f"/api/media/file/{file_id_str}",
    }
    await db.media_meta.insert_one(meta)

    return {
        "file_id"    : file_id_str,
        "filename"   : upload.filename,
        "size_bytes" : len(data),
        "content_type": content_type,
        "url"        : meta["public_url"],
    }


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

# ── POST /api/media/upload-image ─────────────────────────────────────────────

@app.post(
    "/api/media/upload-image",
    summary     = "Upload a single image for an ad",
    description = (
        "Accepts JPEG, PNG, WebP, GIF, BMP, SVG.  "
        "Max size controlled by MAX_IMAGE_MB env var (default 10 MB).  "
        "Pass `ad_id` to link the image to an existing ad, or omit it and "
        "link later via the ad creation step."
    ),
    tags=["Image Upload"],
)
async def upload_image(
    file         : UploadFile = File(..., description="Image file to upload"),
    ad_id        : Optional[str] = Query(None, description="Link image to this ad ID"),
    current_user = Depends(get_current_user),
):
    result = await _store_file(
        upload       = file,
        owner_id     = str(current_user["_id"]),
        ad_id        = ad_id,
        max_mb       = MAX_IMAGE_MB,
        allowed_types= ALLOWED_IMAGE_TYPES,
    )
    return {"success": True, **result}


# ── POST /api/media/upload-file ──────────────────────────────────────────────

@app.post(
    "/api/media/upload-file",
    summary     = "Upload any single file (PDF, ZIP, video, etc.) for an ad",
    description = (
        "No MIME restriction – any file type is accepted.  "
        "Max size controlled by MAX_FILE_MB env var (default 50 MB).  "
        "Use this for documents, archives, or any non-image attachment."
    ),
    tags=["File Upload"],
)
async def upload_file(
    file         : UploadFile = File(..., description="Any file to upload"),
    ad_id        : Optional[str] = Query(None, description="Link file to this ad ID"),
    current_user = Depends(get_current_user),
):
    result = await _store_file(
        upload       = file,
        owner_id     = str(current_user["_id"]),
        ad_id        = ad_id,
        max_mb       = MAX_FILE_MB,
        allowed_types= None,     # no restriction
    )
    return {"success": True, **result}


# ── POST /api/media/upload-folder ────────────────────────────────────────────

@app.post(
    "/api/media/upload-folder",
    summary     = "Upload multiple files at once (folder batch)",
    description = (
        f"Accepts up to {MAX_FOLDER_FILES} files per request.  "
        "Each file is stored individually.  Returns a list of upload results.  "
        "Useful for a 'select folder' workflow on the frontend."
    ),
    tags=["File Upload"],
)
async def upload_folder(
    files        : List[UploadFile] = File(..., description="Multiple files to upload"),
    ad_id        : Optional[str]    = Query(None, description="Link all files to this ad ID"),
    current_user = Depends(get_current_user),
):
    if len(files) > MAX_FOLDER_FILES:
        raise HTTPException(
            400,
            f"Too many files – maximum {MAX_FOLDER_FILES} per batch request."
        )

    owner_id = str(current_user["_id"])
    results  = []
    errors   = []

    for f in files:
        try:
            r = await _store_file(
                upload       = f,
                owner_id     = owner_id,
                ad_id        = ad_id,
                max_mb       = MAX_FILE_MB,
                allowed_types= None,
            )
            results.append(r)
        except HTTPException as exc:
            errors.append({"filename": f.filename, "error": exc.detail})

    return {
        "success"    : True,
        "uploaded"   : len(results),
        "failed"     : len(errors),
        "files"      : results,
        "errors"     : errors,
    }


# ── GET /api/media/ad/{ad_id}  (PUBLIC) ──────────────────────────────────────

@app.get(
    "/api/media/ad/{ad_id}",
    summary     = "List all media files attached to an ad (public)",
    description = "Returns metadata for every file linked to the given ad ID.",
    tags=["Public Access"],
)
async def list_ad_media(ad_id: str):
    cursor = db.media_meta.find(
        {"ad_id": ad_id},
        {"_id": 0},              # exclude internal _id from response
    ).sort("created_at", -1)

    files = []
    async for doc in cursor:
        files.append(doc)

    return {
        "success" : True,
        "ad_id"   : ad_id,
        "count"   : len(files),
        "files"   : files,
    }


# ── GET /api/media/file/{file_id}  (PUBLIC STREAMING) ────────────────────────

@app.get(
    "/api/media/file/{file_id}",
    summary     = "Stream / download a file (public)",
    description = (
        "Streams file bytes directly from GridFS.  "
        "No authentication required – every file uploaded for an ad is "
        "publicly accessible so the ecommerce listing page can display it."
    ),
    tags=["Public Access"],
)
async def stream_file(file_id: str):
    try:
        grid_out = await fs.open_download_stream(ObjectId(file_id))
    except Exception:
        raise HTTPException(404, f"File '{file_id}' not found")

    # Resolve content type from GridFS metadata
    meta         = grid_out.metadata or {}
    content_type = meta.get("content_type", "application/octet-stream")
    filename     = meta.get("original_name", file_id)

    async def _generate():
        while True:
            chunk = await grid_out.readchunk()
            if not chunk:
                break
            yield chunk

    return StreamingResponse(
        _generate(),
        media_type = content_type,
        headers    = {
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control"      : "public, max-age=86400",
        },
    )


# ── DELETE /api/media/file/{file_id}  (OWNER ONLY) ───────────────────────────

@app.delete(
    "/api/media/file/{file_id}",
    summary     = "Delete a file (owner only)",
    description = "Only the user who uploaded the file can delete it.",
    tags=["File Management"],
)
async def delete_file(
    file_id      : str,
    current_user = Depends(get_current_user),
):
    owner_id = str(current_user["_id"])

    # Check ownership via metadata doc
    meta = await db.media_meta.find_one({"file_id": file_id})
    if not meta:
        raise HTTPException(404, f"File '{file_id}' not found")
    if meta["owner_id"] != owner_id:
        raise HTTPException(403, "You do not own this file")

    # Delete from GridFS
    try:
        await fs.delete(ObjectId(file_id))
    except Exception:
        raise HTTPException(500, "GridFS deletion failed")

    # Delete metadata
    await db.media_meta.delete_one({"file_id": file_id})

    return {
        "success" : True,
        "deleted" : file_id,
        "message" : "File deleted successfully",
    }


# ── GET /api/media/my-files  (OWNER LISTING) ─────────────────────────────────

@app.get(
    "/api/media/my-files",
    summary     = "List all files uploaded by the authenticated user",
    tags=["File Management"],
)
async def my_files(
    limit        : int           = Query(50, ge=1, le=200),
    skip         : int           = Query(0,  ge=0),
    current_user = Depends(get_current_user),
):
    owner_id = str(current_user["_id"])

    cursor = (
        db.media_meta
        .find({"owner_id": owner_id}, {"_id": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    files = [doc async for doc in cursor]

    return {
        "success" : True,
        "count"   : len(files),
        "files"   : files,
    }


# ── GET /health ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status"  : "OK",
        "service" : "Media Upload API",
        "time"    : datetime.utcnow(),
    }


# ─────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "media_upload_api:app",
        host   = "0.0.0.0",
        port   = 8001,           # different port from ad_api (8000)
        reload = True,
    )
