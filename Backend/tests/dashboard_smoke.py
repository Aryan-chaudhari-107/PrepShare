"""
Dashboard endpoint smoke test.

Run while the API is up:  python tests/dashboard_smoke.py

Covers:
  1. GET /health            (liveness, no auth)
  2. GET /dashboard/summary anonymous  -> platform block only, personal null
  3. GET /dashboard/summary signed-in  -> full personal ledger, cross-checked
     against direct DB counts so the aggregates are proven, not just "200 OK".

Auth uses the same local JWT minting trick as tests/security_audit.py — the
script talks to the server over HTTP like any other client and never prints
secrets or tokens.
"""

import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from _01_core import create_access_token, settings  # noqa: E402
from _01_core.database import SessionLocal  # noqa: E402
from _02_models import Comment, InterviewPost  # noqa: E402
from sqlalchemy import func  # noqa: E402

BASE = "http://127.0.0.1:8000"
failures = []


def check(label: str, condition: bool, detail: str = ""):
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {label}{(' — ' + detail) if detail else ''}")
    if not condition:
        failures.append(label)


def main() -> int:
    # ---- 1. health -------------------------------------------------------
    print("1. GET /health")
    r = requests.get(f"{BASE}/health", timeout=15)
    check("health returns 200", r.status_code == 200, f"got {r.status_code}")
    check("health body ok", r.json().get("status") == "ok")

    # ---- 1b. readiness (DB round-trip) -----------------------------------
    print("1b. GET /health/ready")
    r = requests.get(f"{BASE}/health/ready", timeout=15)
    check("readiness returns 200", r.status_code == 200, f"got {r.status_code}")
    check("readiness reports db up", r.json().get("database") == "up")

    # ---- 2. anonymous summary -------------------------------------------
    print("2. GET /dashboard/summary (anonymous)")
    r = requests.get(f"{BASE}/dashboard/summary", timeout=30)
    check("anonymous summary 200", r.status_code == 200, f"got {r.status_code}")
    data = r.json()
    check("signed_in is false", data.get("signed_in") is False)
    check("personal counts are null", data.get("counts") is None)
    check("personal streak is null", data.get("streak") is None)
    check(
        "platform totals present",
        data.get("platform", {}).get("total_posts", 0) > 0,
        f"posts={data.get('platform', {}).get('total_posts')}",
    )
    check("active discussions populated", len(data.get("active_discussions", [])) > 0)

    # ---- 3. signed-in summary, cross-checked against the DB --------------
    print("3. GET /dashboard/summary (signed-in)")
    db = SessionLocal()
    try:
        # Pick the most active author so the personal blocks are non-empty.
        author_id, author_posts = (
            db.query(InterviewPost.user_id, func.count(InterviewPost.id))
            .filter(
                InterviewPost.status == "published",
                InterviewPost.deleted_at.is_(None),
            )
            .group_by(InterviewPost.user_id)
            .order_by(func.count(InterviewPost.id).desc())
            .first()
        )
        from _02_models import User

        author = db.query(User).filter(User.id == author_id).one()
        token = create_access_token(
            {"sub": str(author.id), "tv": author.token_version}
        )

        db_posts = (
            db.query(func.count(InterviewPost.id))
            .filter(
                InterviewPost.user_id == author.id,
                InterviewPost.status == "published",
                InterviewPost.deleted_at.is_(None),
            )
            .scalar()
        )
        db_comments = (
            db.query(func.count(Comment.id))
            .filter(Comment.user_id == author.id)
            .scalar()
        )
    finally:
        db.close()

    r = requests.get(
        f"{BASE}/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    check("signed-in summary 200", r.status_code == 200, f"got {r.status_code}")
    if r.status_code != 200:
        print(r.text[:400])
        return 1

    data = r.json()
    counts = data.get("counts") or {}
    check("signed_in is true", data.get("signed_in") is True)
    check(
        "posts count matches DB",
        counts.get("posts") == db_posts,
        f"api={counts.get('posts')} db={db_posts} (author={author.username})",
    )
    check(
        "replies_given matches DB",
        counts.get("replies_given") == db_comments,
        f"api={counts.get('replies_given')} db={db_comments}",
    )
    check(
        "activity series is zero-filled for 14 days",
        len(data.get("activity", [])) == 14,
        f"got {len(data.get('activity', []))}",
    )
    streak = data.get("streak") or {}
    check("streak present", isinstance(streak.get("current"), int) and isinstance(streak.get("best"), int))
    check("best >= current", streak.get("best", 0) >= streak.get("current", 0))
    weekly = data.get("weekly") or {}
    check("weekly goal present", weekly.get("goal") == settings.DASHBOARD_WEEKLY_GOAL and weekly.get("completed", 0) >= 0)
    trend = data.get("trend") or {}
    check(
        "trend present",
        all(k in trend for k in ("posts_this_week", "posts_last_week", "comments_this_week", "comments_last_week")),
    )
    offer = data.get("offer_signal") or {}
    check(
        "offer signal scoped to author",
        offer.get("total") == counts.get("posts"),
        f"offer_total={offer.get('total')} posts={counts.get('posts')}",
    )

    print()
    if failures:
        print(f"FAILED ({len(failures)}): " + ", ".join(failures))
        return 1
    print("ALL DASHBOARD CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
