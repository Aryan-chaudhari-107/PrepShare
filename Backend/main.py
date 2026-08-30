"""FastAPI entry point for the PrepShare backend."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from _01_core import limiter, settings
from _06_routers import auth, posts, users
from _06_routers import bookmarks as bookmarks_router
from _06_routers import chat as chat_router
from _06_routers import comments as comments_router
from _06_routers import companies as companies_router
from _06_routers import completed_questions as completed_questions_router
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

app = FastAPI(title="PrepShare Platform")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static media mount
app.mount("/static/uploads", StaticFiles(directory=static_upload_dir), name="static_uploads")

# Core & Feature Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(companies_router.router)
app.include_router(institutions_router.router)
app.include_router(education_router.router)
app.include_router(comments_router.router)
app.include_router(likes_router.router)
app.include_router(bookmarks_router.router)
app.include_router(questions_router.router)
app.include_router(completed_questions_router.router)
app.include_router(follows_router.router)
app.include_router(notifications_router.router)
app.include_router(reports_router.router)
app.include_router(chat_router.router)
app.include_router(uploads_router.router)
