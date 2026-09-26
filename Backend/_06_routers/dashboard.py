"""Router for the dashboard aggregates and service health."""

from typing import Optional

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from _01_core import get_current_user_optional, get_db, limiter
from _01_core.database import wait_for_database
from _02_models import User
from _03_schemas.dashboard import DashboardSummary
from _05_services import dashboard

# The summary adapts to the caller: signed-in users get their personal ledger,
# anonymous visitors get platform-wide numbers — one endpoint, no 401s.
router = APIRouter(prefix="/dashboard", tags=["dashboard"])
health_router = APIRouter(tags=["health"])


@router.get("/summary", response_model=DashboardSummary)
@limiter.limit("60/minute")  # public (anonymous-friendly) — keep the aggregates cheap
def get_dashboard_summary(
    request: Request,
    response: Response,  # slowapi writes X-RateLimit-* headers onto this
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    return dashboard.get_summary(db, current_user)


@health_router.get("/health")
def health_check():
    """Liveness probe — no DB round-trip, safe to poll."""
    return {"status": "ok", "service": "prepshare-api"}


@health_router.get("/health/ready")
def readiness_check():
    """Readiness probe — verifies a real DB round-trip (one fast retry).

    Returns 503 while the database is unreachable so orchestrators and
    load balancers hold traffic instead of sending requests into 500s.
    """
    if wait_for_database(retries=2, base_delay=0.2):
        return {"status": "ready", "service": "prepshare-api", "database": "up"}
    return JSONResponse(
        status_code=503,
        content={"status": "unavailable", "service": "prepshare-api", "database": "down"},
    )
