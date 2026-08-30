# One-off script: backfill published_at = created_at for any published posts
# where published_at IS NULL (defect D5).
#
# Run once from the repo root:
#   .\venv\Scripts\python.exe scripts\backfill_published_at.py

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from _01_core.database import SessionLocal
from _02_models import InterviewPost


def main():
    db = SessionLocal()
    try:
        rows = (
            db.query(InterviewPost)
            .filter(
                InterviewPost.status == "published",
                InterviewPost.published_at.is_(None),
            )
            .all()
        )

        if not rows:
            print("No rows to backfill — published_at is set on all published posts.")
            return

        count = len(rows)
        print("Found " + str(count) + " published post(s) with published_at IS NULL")
        for post in rows:
            post.published_at = post.created_at

        db.commit()
        print("Backfilled " + str(count) + " row(s): published_at = created_at.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
