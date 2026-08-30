"""FastAPI router for secure media & document uploads."""

import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from _01_core import get_current_user
from _02_models import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024       # 5 MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024   # 10 MB


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, WEBP, GIF, PDF."
        )

    ext = ALLOWED_EXTENSIONS[content_type]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Read and validate file size
    contents = await file.read()
    max_size = MAX_DOCUMENT_SIZE if content_type == "application/pdf" else MAX_IMAGE_SIZE
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum allowed size is {max_size // (1024*1024)} MB."
        )

    with open(dest_path, "wb") as f:
        f.write(contents)

    return {
        "url": f"/static/uploads/{unique_filename}",
        "filename": unique_filename,
        "content_type": content_type,
        "size_bytes": len(contents),
    }
