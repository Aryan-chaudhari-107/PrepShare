"""FastAPI router for secure media & document uploads.

Uploads return a ``data:`` URL (base64) instead of writing to disk: the
serverless filesystem on Vercel is read-only, and data URLs need no static
file serving either, so the same code works locally and in production.
Images are re-encoded first so payloads stay small — avatars are capped
at 320px (they render at 80px max), attachments at 1600px for readability.
"""

import base64
import io
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from _01_core import get_current_user
from _02_models import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024       # 5 MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024   # 10 MB

AVATAR_MAX_EDGE = 320
AVATAR_JPEG_QUALITY = 82
ATTACHMENT_MAX_EDGE = 1600
ATTACHMENT_JPEG_QUALITY = 85


def _to_data_url(raw: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(raw).decode('ascii')}"


def _optimise_image(contents: bytes, content_type: str, kind: str) -> tuple[bytes, str]:
    """Validate with a real decode, downscale, and re-encode.

    PNGs with transparency stay PNG; everything else becomes JPEG so the
    base64 payload stays small enough to ship inside API responses.
    """
    from PIL import Image, ImageOps  # lazy import keeps cold starts lean

    try:
        img = Image.open(io.BytesIO(contents))
        img.load()  # force full decode — rejects truncated/corrupt files
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a valid image file.",
        ) from exc

    img = ImageOps.exif_transpose(img)

    max_edge = AVATAR_MAX_EDGE if kind == "avatar" else ATTACHMENT_MAX_EDGE
    if max(img.size) > max_edge:
        img.thumbnail((max_edge, max_edge), Image.LANCZOS)

    buf = io.BytesIO()
    if content_type == "image/png" and img.mode in ("RGBA", "LA", "P"):
        img.save(buf, format="PNG", optimize=True)
        return buf.getvalue(), "image/png"

    if img.mode != "RGB":
        img = img.convert("RGB")
    quality = AVATAR_JPEG_QUALITY if kind == "avatar" else ATTACHMENT_JPEG_QUALITY
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue(), "image/jpeg"


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    kind: Literal["avatar", "attachment"] = Form("attachment"),
    current_user: User = Depends(get_current_user),
):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, WEBP, GIF, PDF.",
        )

    # Read and validate file size
    contents = await file.read()
    max_size = MAX_DOCUMENT_SIZE if content_type == "application/pdf" else MAX_IMAGE_SIZE
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum allowed size is {max_size // (1024*1024)} MB."
        )

    if content_type in ("image/gif", "application/pdf"):
        # GIFs keep their animation, PDFs their fidelity — validate only.
        if content_type == "application/pdf" and b"%PDF" not in contents[:1024]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not a valid PDF file.",
            )
        if content_type == "image/gif":
            try:
                from PIL import Image

                Image.open(io.BytesIO(contents)).load()
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not a valid image file.",
                ) from exc
        raw, final_type = contents, content_type
    else:
        raw, final_type = _optimise_image(contents, content_type, kind)

    return {
        "url": _to_data_url(raw, final_type),
        "filename": f"{uuid.uuid4().hex}{ALLOWED_EXTENSIONS[final_type]}",
        "content_type": final_type,
        "size_bytes": len(raw),
    }
