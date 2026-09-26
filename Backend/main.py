"""FastAPI entry point for the PrepShare backend."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from _01_core import limiter, settings
from _01_core.database import wait_for_database
from _06_routers import auth, posts, users
from _06_routers import bookmarks as bookmarks_router
from _06_routers import chat as chat_router
from _06_routers import comments as comments_router
from _06_routers import companies as companies_router
from _06_routers import completed_questions as completed_questions_router
from _06_routers import dashboard as dashboard_router
from _06_routers import education_history as education_router
from _06_routers import follows as follows_router
from _06_routers import institutions as institutions_router
from _06_routers import likes as likes_router
from _06_routers import notifications as notifications_router
from _06_routers import questions as questions_router
from _06_routers import reports as reports_router
from _06_routers import uploads as uploads_router

# Ensure static/uploads exists
static_upload_dir = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(static_upload_dir, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Probe the database once at boot with backoff, so a cold Supabase
    instance gets a few retries and a clear log line instead of the first
    request failing with a cryptic 500."""
    wait_for_database()
    yield


app = FastAPI(title="PrepShare Platform", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Let browser JS read the quota headers cross-origin.
    expose_headers=["Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

# Static media mount
app.mount("/static/uploads", StaticFiles(directory=static_upload_dir), name="static_uploads")

# Core & Feature Routers
# Each router is mounted twice: bare (local dev, CI tests) and under /api.
# On Vercel the request.path transform is a no-op, so the live site's
# /api/* requests reach FastAPI unmodified and need these prefixed routes.
_feature_routers = [
    auth.router,
    users.router,
    posts.router,
    companies_router.router,
    institutions_router.router,
    education_router.router,
    comments_router.router,
    likes_router.router,
    bookmarks_router.router,
    questions_router.router,
    completed_questions_router.router,
    follows_router.router,
    notifications_router.router,
    reports_router.router,
    chat_router.router,
    uploads_router.router,
    dashboard_router.router,
]
for _router in _feature_routers:
    app.include_router(_router)
    app.include_router(_router, prefix="/api")

app.include_router(dashboard_router.health_router)
app.include_router(dashboard_router.health_router, prefix="/api")
