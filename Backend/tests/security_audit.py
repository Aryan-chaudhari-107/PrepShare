"""
Security and Negative-Testing Audit Suite for PrepShare Backend.
Tests:
1. Authentication (No token, invalid JWT, expired JWT, malformed bearer)
2. Authorization / IDOR (Cross-user education, posts, comments manipulation)
3. Post Privacy & Anonymity (Draft secrecy, anonymous data suppression)
4. Validation & Edge Cases (Invalid UUIDs, enums, missing fields, pagination)
5. Authentication Flows (Invalid credentials, invalid OTPs)
6. Interaction Endpoints & State (Idempotency, voting balance, nonexistent targets)
7. Database & API Robustness (No unhandled 500s, duplicate conflicts, nonexistent resources)
"""

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt
import requests
from sqlalchemy import bindparam, text

from _01_core.config import settings
from _01_core.database import SessionLocal
from _02_models import User, Institution

BASE = "http://127.0.0.1:8000"

results = []

# Exact titles this audit writes to the SHARED database (locally and on every
# CI push). Kept in one place so run_audit() and cleanup_test_artifacts()
# can never drift apart.
AUDIT_POST_TITLES = (
    "User B Secret Draft Post",
    "Public Post For Comments",
    "Anonymous Confidential Experience",
    "Draft for Offer Check",
    "Vote Testing Post",
    "Draft Edit Flow Test",
    "Draft Edit Flow Test Edited",
)

def record(category, endpoint, case, expected_status, actual_status, passed, significance, details=""):
    results.append({
        "category": category,
        "endpoint": endpoint,
        "case": case,
        "expected": expected_status,
        "actual": actual_status,
        "passed": passed,
        "significance": significance,
        "details": details
    })


def mint_token(user_id: uuid.UUID, expires_delta: timedelta | None = None, tv: int = 1) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=60))
    to_encode = {"sub": str(user_id), "tv": tv, "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def cleanup_test_artifacts(extra_titles=()):
    """Delete every row this audit creates from the shared database.

    Markers are the exact constants used by the audit, so this also sweeps
    leftovers from earlier runs or runs that crashed before cleaning up.
    Extra titles (e.g. manual_flow's) may be passed in. Raw SQL in explicit
    FK order — independent of ON DELETE clauses. Best-effort: never raises;
    returns the per-table counts it removed.
    """
    titles = list(AUDIT_POST_TITLES) + list(extra_titles)
    db = SessionLocal()
    counts = {}
    try:
        def run(name, stmt, **params):
            bound = text(stmt).bindparams(bindparam("ids", expanding=True))
            n = db.execute(bound, params).rowcount
            if n:
                counts[name] = counts.get(name, 0) + n

        post_rows = db.execute(
            text("SELECT id FROM interview_posts WHERE title IN :titles").bindparams(
                bindparam("titles", expanding=True)
            ),
            {"titles": titles},
        ).fetchall()
        post_ids = [r[0] for r in post_rows]

        round_ids = []
        if post_ids:
            round_ids = [
                r[0]
                for r in db.execute(
                    text("SELECT DISTINCT round_id FROM post_rounds WHERE post_id IN :ids").bindparams(
                        bindparam("ids", expanding=True)
                    ),
                    {"ids": post_ids},
                ).fetchall()
            ]

            # polymorphic references (no FK) go first
            run("notifications", "DELETE FROM notifications WHERE reference_id IN :ids", ids=post_ids)
            run(
                "contribution_events",
                "DELETE FROM contribution_events WHERE reference_id IN :ids",
                ids=post_ids,
            )
            # children of the posts
            run(
                "question_votes",
                "DELETE FROM question_difficulty_votes WHERE question_id IN "
                "(SELECT id FROM interview_questions WHERE post_id IN :ids)",
                ids=post_ids,
            )
            run(
                "completed_questions",
                "DELETE FROM completed_questions WHERE question_id IN "
                "(SELECT id FROM interview_questions WHERE post_id IN :ids)",
                ids=post_ids,
            )
            run(
                "question_tags",
                "DELETE FROM question_tag_map WHERE question_id IN "
                "(SELECT id FROM interview_questions WHERE post_id IN :ids)",
                ids=post_ids,
            )
            run("questions", "DELETE FROM interview_questions WHERE post_id IN :ids", ids=post_ids)
            run("comments", "DELETE FROM comments WHERE post_id IN :ids", ids=post_ids)
            run("likes", "DELETE FROM likes WHERE post_id IN :ids", ids=post_ids)
            run("bookmarks", "DELETE FROM bookmarks WHERE post_id IN :ids", ids=post_ids)
            run("reports", "DELETE FROM reports WHERE post_id IN :ids", ids=post_ids)
            run("post_rounds", "DELETE FROM post_rounds WHERE post_id IN :ids", ids=post_ids)
            run("posts", "DELETE FROM interview_posts WHERE id IN :ids", ids=post_ids)

        # rounds are standalone — only drop the ones no other post uses
        if round_ids:
            round_ids = [
                r[0]
                for r in db.execute(
                    text("SELECT id FROM interview_rounds WHERE id IN :ids").bindparams(
                        bindparam("ids", expanding=True)
                    ),
                    {"ids": round_ids},
                ).fetchall()
            ]
            still_used = {
                r[0]
                for r in db.execute(
                    text("SELECT DISTINCT round_id FROM post_rounds WHERE round_id IN :ids").bindparams(
                        bindparam("ids", expanding=True)
                    ),
                    {"ids": round_ids},
                ).fetchall()
            }
            orphans = [r for r in round_ids if r not in still_used]
            if orphans:
                run("rounds", "DELETE FROM interview_rounds WHERE id IN :ids", ids=orphans)

        # audit education rows: exact payload of section 2.1 (seed rows always
        # carry an end_year and is_current=False)
        counts["education"] = db.execute(
            text(
                "DELETE FROM education_history WHERE course = 'Computer Science' "
                "AND degree_level = 'Bachelors' AND start_year = 2020 "
                "AND is_current = TRUE AND end_year IS NULL"
            )
        ).rowcount or 0
        if not counts["education"]:
            counts.pop("education")

        # the DuplicateTest company from 7.2 (detach posts that picked it first)
        cids = [
            r[0]
            for r in db.execute(
                text("SELECT id FROM companies WHERE name LIKE 'DuplicateTest_%'")
            ).fetchall()
        ]
        if cids:
            run("company_stats", "DELETE FROM company_statistics WHERE company_id IN :ids", ids=cids)
            run(
                "post_company_refs",
                "UPDATE interview_posts SET company_id = NULL WHERE company_id IN :ids",
                ids=cids,
            )
            run("companies", "DELETE FROM companies WHERE id IN :ids", ids=cids)

        db.commit()
    except Exception as exc:  # cleanup must never fail the audit
        db.rollback()
        print(f"[cleanup] skipped: {exc}")
        return counts
    finally:
        db.close()
    return counts


def hide_from_feed(post_id):
    """Soft-delete an audit post the moment its last test has run.

    The feed and public-profile queries filter ``deleted_at IS NULL``, so the
    shared public feed stops showing the post immediately while the audit
    keeps running; the rows stay for cleanup_test_artifacts at the end.
    """
    if not post_id:
        return
    db = SessionLocal()
    try:
        db.execute(text("UPDATE interview_posts SET deleted_at = now() WHERE id = :id"), {"id": post_id})
        db.commit()
    finally:
        db.close()


def run_audit():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        if len(users) < 2:
            raise RuntimeError("Need at least 2 users in DB to run IDOR tests.")
        user_a_id = users[0].id
        user_a_email = users[0].email
        user_a_tv = users[0].token_version
        user_b_id = users[1].id
        user_b_email = users[1].email
        user_b_tv = users[1].token_version

        inst = db.query(Institution).first()
        if not inst:
            inst = Institution(name="Audit University", city="Mumbai", country="India", type="university")
            db.add(inst)
            db.commit()
            db.refresh(inst)
        institution_id = inst.id
    finally:
        db.close()

    token_a = mint_token(user_a_id, tv=user_a_tv)
    token_b = mint_token(user_b_id, tv=user_b_tv)
    expired_token = mint_token(user_a_id, expires_delta=timedelta(hours=-2), tv=user_a_tv)

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}
    headers_expired = {"Authorization": f"Bearer {expired_token}"}
    headers_invalid = {"Authorization": "Bearer invalid.jwt.signature_here"}
    headers_malformed = {"Authorization": "BearerNotATokenStructure"}

    # =========================================================================
    # 1. AUTHENTICATION
    # =========================================================================
    # 1.1 Access protected endpoint without token
    r = requests.get(f"{BASE}/users/me")
    passed = r.status_code in (401, 403)
    record("1. Auth", "GET /users/me", "No Authorization header", "401/403", r.status_code, passed, "Prevents unauthenticated access to user profile")

    # 1.2 Invalid JWT
    r = requests.get(f"{BASE}/users/me", headers=headers_invalid)
    passed = r.status_code == 401
    record("1. Auth", "GET /users/me", "Forged/Invalid JWT signature", "401", r.status_code, passed, "Rejects tampered or forged authentication tokens")

    # 1.3 Expired JWT
    r = requests.get(f"{BASE}/users/me", headers=headers_expired)
    passed = r.status_code == 401
    record("1. Auth", "GET /users/me", "Expired JWT token (exp in past)", "401", r.status_code, passed, "Enforces session expiration and lifetime limits")

    # 1.4 Malformed Bearer token
    r = requests.get(f"{BASE}/users/me", headers=headers_malformed)
    passed = r.status_code in (401, 403)
    record("1. Auth", "GET /users/me", "Malformed Bearer format", "401/403", r.status_code, passed, "Ensures HTTP Authorization header parser handles bad format cleanly")

    # =========================================================================
    # 2. AUTHORIZATION / IDOR
    # =========================================================================
    # Setup User B resources
    # Create Education for User B
    r_b_edu = requests.post(f"{BASE}/users/me/education/", json={
        "institution_id": str(institution_id),
        "degree_level": "Bachelors",
        "course": "Computer Science",
        "education_type": "full_time",
        "start_year": 2020,
        "is_current": True
    }, headers=headers_b)
    b_edu_id = r_b_edu.json().get("id") if r_b_edu.status_code == 201 else None

    # Setup User B draft post
    r_b_post = requests.post(f"{BASE}/posts/", json={
        "post_category": "campus_placement",
        "title": "User B Secret Draft Post"
    }, headers=headers_b)
    b_post_id = r_b_post.json().get("post_id") if r_b_post.status_code == 200 else None

    # Setup User B comment on a post
    # Create public post by User A to comment on
    r_a_post = requests.post(f"{BASE}/posts/", json={
        "post_category": "campus_placement",
        "title": "Public Post For Comments"
    }, headers=headers_a)
    a_post_id = r_a_post.json().get("post_id")
    # Publish A's post
    requests.put(f"{BASE}/posts/{a_post_id}/publish", json={
        "experience_text": "Published post for comment testing.",
        "is_offer_received": False
    }, headers=headers_a)

    r_b_comment = requests.post(f"{BASE}/posts/{a_post_id}/comments", json={
        "comment_text": "User B Comment Text"
    }, headers=headers_b)
    b_comment_id = r_b_comment.json().get("id") if r_b_comment.status_code == 201 else None

    # --- Everything that needs the public post LIVE runs right here, while it
    # --- is fresh, and the post is then soft-deleted from the feed. CI runs
    # --- this audit against the production database on every push, so the
    # --- shared public feed must only ever see these rows for the seconds
    # --- between the publish above and the hide_from_feed call below.

    # 4.3 Empty string for min-length constrained field
    r = requests.post(f"{BASE}/posts/{a_post_id}/comments", json={"comment_text": ""}, headers=headers_a)
    passed = r.status_code == 422
    record("4. Validation", "POST /posts/{id}/comments", "Empty string comment_text (min_length=1)", "422", r.status_code, passed, "Blocks blank/spam submissions")

    # 6.1 Like toggle idempotency & state correctness
    # Rapid toggle x4
    l1 = requests.post(f"{BASE}/posts/{a_post_id}/like", headers=headers_a).json().get("liked")
    l2 = requests.post(f"{BASE}/posts/{a_post_id}/like", headers=headers_a).json().get("liked")
    l3 = requests.post(f"{BASE}/posts/{a_post_id}/like", headers=headers_a).json().get("liked")
    l4 = requests.post(f"{BASE}/posts/{a_post_id}/like", headers=headers_a).json().get("liked")
    passed_like = (l1 != l2) and (l2 != l3) and (l3 != l4)
    record("6. State", "POST /posts/{id}/like", "Like/unlike toggle cycle state consistency", "Alternating True/False", f"{l1}->{l2}->{l3}->{l4}", passed_like, "Prevents duplicate like records or desynchronized like counters")

    # 6.2 Bookmark toggle cycle
    b1 = requests.post(f"{BASE}/posts/{a_post_id}/bookmark", headers=headers_a).json().get("bookmarked")
    b2 = requests.post(f"{BASE}/posts/{a_post_id}/bookmark", headers=headers_a).json().get("bookmarked")
    passed_bm = (b1 != b2)
    record("6. State", "POST /posts/{id}/bookmark", "Bookmark/unbookmark toggle cycle", "Alternating True/False", f"{b1}->{b2}", passed_bm, "Ensures reliable bookmark state toggling")

    # Last test on this post has run: out of the public feed immediately
    # (rows stay until cleanup_test_artifacts at the end of the run).
    hide_from_feed(a_post_id)

    # 2.1 User A attempts to edit User B's education record
    if b_edu_id:
        r = requests.patch(f"{BASE}/users/me/education/{b_edu_id}", json={
            "course": "Hacked Course"
        }, headers=headers_a)
        passed = r.status_code in (400, 403, 404)
        record("2. IDOR", "PATCH /users/me/education/{id}", "User A modifies User B education record", "400/404", r.status_code, passed, "Strict tenant isolation on private education records")

    # 2.2 User A attempts to delete User B's education record
    if b_edu_id:
        r = requests.delete(f"{BASE}/users/me/education/{b_edu_id}", headers=headers_a)
        passed = r.status_code in (400, 403, 404)
        record("2. IDOR", "DELETE /users/me/education/{id}", "User A deletes User B education record", "400/404", r.status_code, passed, "Prevents cross-user education record destruction")

    # 2.3 User A attempts to edit User B's post
    if b_post_id:
        r = requests.patch(f"{BASE}/posts/{b_post_id}", json={
            "title": "Hacked Title by User A"
        }, headers=headers_a)
        passed = r.status_code in (400, 403, 404)
        record("2. IDOR", "PATCH /posts/{id}", "User A modifies User B post", "400/404", r.status_code, passed, "Ensures post authorship authorization checks")

    # 2.4 User A attempts to publish User B's post
    if b_post_id:
        r = requests.put(f"{BASE}/posts/{b_post_id}/publish", json={
            "experience_text": "Forced publish by User A",
            "is_offer_received": False
        }, headers=headers_a)
        passed = r.status_code in (400, 403, 404)
        record("2. IDOR", "PUT /posts/{id}/publish", "User A forcibly publishes User B post", "400/404", r.status_code, passed, "Prevents unauthorized publishing of user drafts")

    # 2.5 User A attempts to edit User B's comment
    if b_comment_id:
        r = requests.patch(f"{BASE}/comments/{b_comment_id}", json={
            "comment_text": "Hacked Comment by User A"
        }, headers=headers_a)
        passed = r.status_code in (400, 403, 404)
        record("2. IDOR", "PATCH /comments/{id}", "User A modifies User B comment", "400/404", r.status_code, passed, "Enforces comment ownership integrity")

    # 2.6 User A attempts to delete User B's comment
    if b_comment_id:
        r = requests.delete(f"{BASE}/comments/{b_comment_id}", headers=headers_a)
        passed = r.status_code in (400, 403, 404)
        record("2. IDOR", "DELETE /comments/{id}", "User A deletes User B comment", "400/404", r.status_code, passed, "Prevents unauthorized comment deletion")

    # =========================================================================
    # 3. POST PRIVACY & ANONYMITY
    # =========================================================================
    # 3.1 Stranger / Unauthenticated reads User B's draft
    if b_post_id:
        r_unauth = requests.get(f"{BASE}/posts/{b_post_id}")
        r_user_a = requests.get(f"{BASE}/posts/{b_post_id}", headers=headers_a)
        passed = (r_unauth.status_code == 404) and (r_user_a.status_code == 404)
        record("3. Privacy", "GET /posts/{draft_id}", "Stranger/User A reads User B draft", "404", f"Unauth:{r_unauth.status_code}, UserA:{r_user_a.status_code}", passed, "Draft posts are completely hidden from non-owners")

    # 3.2 Anonymous Post contract
    # Create an anonymous published post
    r_anon = requests.post(f"{BASE}/posts/", json={
        "post_category": "campus_placement",
        "title": "Anonymous Confidential Experience"
    }, headers=headers_a)
    anon_post_id = r_anon.json().get("post_id")
    requests.put(f"{BASE}/posts/{anon_post_id}/publish", json={
        "experience_text": "Confidential interview details.",
        "is_offer_received": True,
        "job_role": "Security Engineer",
        "package_amount": 1500000,
        "currency": "INR"
    }, headers=headers_a)
    requests.patch(f"{BASE}/posts/{anon_post_id}", json={"is_anonymous": True}, headers=headers_a)

    r_anon_get = requests.get(f"{BASE}/posts/{anon_post_id}")
    anon_body = r_anon_get.json()
    anon_author = anon_body.get("author")
    anon_slug = anon_body.get("slug")
    anon_leaked = [k for k in ("user_id", "username", "profile_photo_url") if k in anon_body] + [k for k in ("education_id", "institution_name", "course_name") if anon_body.get(k) is not None]
    passed_anon = (anon_author is None) and (anon_slug is None) and (len(anon_leaked) == 0)
    record("3. Privacy", "GET /posts/{anon_id}", "Verify anonymous post fields redacted", "author=None, slug=None", f"author:{anon_author}, slug:{anon_slug}, leaks:{anon_leaked}", passed_anon, "Prevents deanonymization of anonymous contributors")

    # 3.3 Public Profile Data Leak Check
    r_pub_prof = requests.get(f"{BASE}/users/{user_a_id}")
    prof_body = r_pub_prof.json()
    prof_leaks = [k for k in ("email", "password_hash", "is_email_verified", "user_settings") if k in prof_body]
    passed_prof = (r_pub_prof.status_code == 200) and (len(prof_leaks) == 0)
    record("3. Privacy", "GET /users/{id}", "Public profile sanitization check", "200 (no email/hash)", f"leaks: {prof_leaks}", passed_prof, "Prevents user PII / credential hash disclosure")

    # 3.4 Public User Posts Check (Exclude Anonymous)
    r_pub_posts = requests.get(f"{BASE}/users/{user_a_id}/posts")
    pub_posts_items = r_pub_posts.json().get("items", [])
    has_anon_in_profile = any(item.get("id") == anon_post_id for item in pub_posts_items)
    record("3. Privacy", "GET /users/{id}/posts", "Anonymous posts excluded from public profile", "Excluded", f"Found anon post: {has_anon_in_profile}", not has_anon_in_profile, "Prevents linking anonymous posts via user profile post lists")

    # 3.4 was the last test on this post: out of the public feed immediately.
    hide_from_feed(anon_post_id)

    # =========================================================================
    # 4. INPUT VALIDATION & EDGE CASES
    # =========================================================================
    # 4.1 Invalid UUID path param
    r = requests.get(f"{BASE}/posts/not-a-valid-uuid-format")
    passed = r.status_code == 422
    record("4. Validation", "GET /posts/{invalid_uuid}", "Malformed non-UUID path parameter", "422", r.status_code, passed, "Input format validation on UUID path parameters")

    # 4.2 Missing required payload fields
    r = requests.post(f"{BASE}/posts/", json={}, headers=headers_a)
    passed = r.status_code == 422
    record("4. Validation", "POST /posts/", "Empty JSON body (missing title & category)", "422", r.status_code, passed, "Enforces required field validation before DB write")

    # 4.4 Invalid Enum value
    r = requests.post(f"{BASE}/questions/{uuid.uuid4()}/vote", json={"difficulty": "extreme_impossible"}, headers=headers_a)
    passed = r.status_code == 422
    record("4. Validation", "POST /questions/{id}/vote", "Invalid enum value for difficulty", "422", r.status_code, passed, "Rejects unexpected enum literals")

    # 4.5 Invalid pagination values (negative page/limit)
    r = requests.get(f"{BASE}/posts/?page=0&limit=-5")
    passed = r.status_code == 422
    record("4. Validation", "GET /posts/?page=0&limit=-5", "Invalid pagination bounds (page=0, limit=-5)", "422", r.status_code, passed, "Guards against negative offset / limit SQL injection or panic")

    # 4.6 Publish post missing required conditional fields (is_offer_received=True without job_role/package)
    r_draft_cond = requests.post(f"{BASE}/posts/", json={"post_category": "campus_placement", "title": "Draft for Offer Check"}, headers=headers_a)
    draft_cond_id = r_draft_cond.json().get("post_id")
    r = requests.put(f"{BASE}/posts/{draft_cond_id}/publish", json={
        "experience_text": "Experience text provided.",
        "is_offer_received": True,
        "job_role": None,
        "package_amount": None
    }, headers=headers_a)
    passed = r.status_code in (400, 422)
    record("4. Validation", "PUT /posts/{id}/publish", "Conditional required fields when is_offer_received=True", "400/422", r.status_code, passed, "Enforces domain integrity on job offers")

    # =========================================================================
    # 5. AUTHENTICATION FLOWS & OTP EDGE CASES
    # =========================================================================
    # 5.1 Invalid Login Password
    r = requests.post(f"{BASE}/auth/login", json={
        "identifier": user_a_email,
        "password": "WrongPassword123!"
    })
    passed = r.status_code == 401
    record("5. Auth Flows", "POST /auth/login", "Invalid password authentication", "401", r.status_code, passed, "Rejects incorrect password attempts")

    # 5.2 Nonexistent User Login
    r = requests.post(f"{BASE}/auth/login", json={
        "identifier": "nonexistent_user_xyz_99@example.com",
        "password": "AnyPassword123!"
    })
    passed = r.status_code == 401
    record("5. Auth Flows", "POST /auth/login", "Nonexistent user authentication", "401", r.status_code, passed, "Rejects nonexistent account credentials")

    # 5.3 Verify registration with invalid OTP
    r = requests.post(f"{BASE}/auth/verify-and-register", json={
        "email": "test_security_audit@example.com",
        "otp_code": "000000",
        "username": "test_sec_user",
        "password": "StrongPassword123!"
    })
    passed = r.status_code in (400, 401, 404)
    record("5. Auth Flows", "POST /auth/verify-and-register", "Invalid/forged OTP code verification", "400", r.status_code, passed, "Blocks unverified registration bypass")

    # 5.4 Password reset with invalid OTP
    r = requests.post(f"{BASE}/auth/reset-password", json={
        "email": "security_test_user@example.com",
        "otp_code": "000000",
        "new_password": "NewStrongPassword123!"
    })
    passed = r.status_code in (400, 401, 404)
    record("5. Auth Flows", "POST /auth/reset-password", "Invalid OTP for password reset", "400", r.status_code, passed, "Blocks unauthorized account takeover via OTP guessing")

    # =========================================================================
    # 6. INTERACTION ENDPOINTS & STATE CONSISTENCY
    # =========================================================================
    # Setup a fresh draft post for question and vote testing
    r_vote_post = requests.post(f"{BASE}/posts/", json={"post_category": "campus_placement", "title": "Vote Testing Post"}, headers=headers_a)
    vote_post_id = r_vote_post.json().get("post_id")
    r_round = requests.post(f"{BASE}/posts/{vote_post_id}/rounds", json={"name": "Tech Round", "mode": "online"}, headers=headers_a)
    round_id = r_round.json().get("post_round_id")
    r_q = requests.post(f"{BASE}/posts/{vote_post_id}/rounds/{round_id}/questions", json={"question_text": "Algorithm question?"}, headers=headers_a)
    q_id = r_q.json().get("question_id")

    # 6.3 Difficulty vote state transitions & counter conservation
    if q_id:
        v_easy = requests.post(f"{BASE}/questions/{q_id}/vote", json={"difficulty": "easy"}, headers=headers_a).json()
        v_hard = requests.post(f"{BASE}/questions/{q_id}/vote", json={"difficulty": "hard"}, headers=headers_a).json()
        v_off = requests.post(f"{BASE}/questions/{q_id}/vote", json={"difficulty": "hard"}, headers=headers_a).json()

        vote_balance_ok = (
            v_easy.get("easy_count") == 1 and v_easy.get("hard_count") == 0 and
            v_hard.get("easy_count") == 0 and v_hard.get("hard_count") == 1 and
            v_off.get("easy_count") == 0 and v_off.get("hard_count") == 0 and v_off.get("difficulty") is None
        )
        record("6. State", "POST /questions/{id}/vote", "Difficulty vote switching and counter preservation", "Net 0 after toggle off", f"Final: easy={v_off.get('easy_count')}, hard={v_off.get('hard_count')}", vote_balance_ok, "Prevents desynchronization between vote rows and cached counters")

    # 6.4 Nonexistent Post ID operations
    fake_id = uuid.uuid4()
    r_like_fake = requests.post(f"{BASE}/posts/{fake_id}/like", headers=headers_a)
    r_bm_fake = requests.post(f"{BASE}/posts/{fake_id}/bookmark", headers=headers_a)
    r_comm_fake = requests.post(f"{BASE}/posts/{fake_id}/comments", json={"comment_text": "Comment on fake post"}, headers=headers_a)
    passed_fake_post = (r_like_fake.status_code in (400, 404)) and (r_bm_fake.status_code in (400, 404)) and (r_comm_fake.status_code in (400, 404))
    record("6. State", "POST /posts/{fake_id}/[like|bookmark|comments]", "Interactions on nonexistent post ID", "400/404", f"Like:{r_like_fake.status_code}, BM:{r_bm_fake.status_code}, Comm:{r_comm_fake.status_code}", passed_fake_post, "Ensures graceful error handling on missing post resources")

    # 6.5 Nonexistent Question ID operations
    r_vote_fake = requests.post(f"{BASE}/questions/{fake_id}/vote", json={"difficulty": "easy"}, headers=headers_a)
    r_comp_fake = requests.post(f"{BASE}/questions/{fake_id}/complete", headers=headers_a)
    passed_fake_q = (r_vote_fake.status_code in (400, 404)) and (r_comp_fake.status_code in (400, 404))
    record("6. State", "POST /questions/{fake_id}/[vote|complete]", "Operations on nonexistent question ID", "400/404", f"Vote:{r_vote_fake.status_code}, Complete:{r_comp_fake.status_code}", passed_fake_q, "Ensures graceful error handling on missing question resources")

    # =========================================================================
    # 8. DRAFT EDITING (resume + replace semantics)
    # =========================================================================
    # 8.1 Resume surface: draft detail must carry everything the wizard
    # hydrates when the user clicks "Continue editing".
    r_edit_post = requests.post(f"{BASE}/posts/", json={
        "post_category": "campus_placement",
        "title": "Draft Edit Flow Test",
    }, headers=headers_a)
    edit_post_id = r_edit_post.json().get("post_id")
    r_edit_rnd = requests.post(f"{BASE}/posts/{edit_post_id}/rounds", json={
        "name": "Tech Screen", "mode": "online", "duration_minutes": 45,
    }, headers=headers_a)
    edit_rnd_id = r_edit_rnd.json().get("post_round_id")
    requests.post(f"{BASE}/posts/{edit_post_id}/rounds/{edit_rnd_id}/questions", json={
        "question_text": "Resume payload probe question",
    }, headers=headers_a)

    r_det = requests.get(f"{BASE}/posts/{edit_post_id}", headers=headers_a)
    det = r_det.json() if r_det.status_code == 200 else {}
    det_rounds = det.get("rounds") or []
    passed_resume = (
        r_det.status_code == 200
        and det.get("status") == "draft"
        and det.get("is_owner") is True
        and len(det_rounds) == 1
        and det_rounds[0].get("duration_minutes") == 45
        and len(det_rounds[0].get("questions") or []) == 1
    )
    record("8. Draft Edit", "GET /posts/{id}", "Draft detail carries full resume payload", "200 + round/timing/questions", f"{r_det.status_code}, rounds={len(det_rounds)}", passed_resume, "Lets 'Continue editing' hydrate the wizard instead of starting blank")

    # 8.2 Step-1 re-submit patches in place — never duplicates the draft
    db_cnt = SessionLocal()
    try:
        drafts_before = db_cnt.execute(
            text("SELECT count(*) FROM interview_posts WHERE user_id = :u AND status = 'draft' AND deleted_at IS NULL"),
            {"u": user_a_id},
        ).scalar()
    finally:
        db_cnt.close()

    r_pat = requests.patch(f"{BASE}/posts/{edit_post_id}", json={
        "title": "Draft Edit Flow Test Edited",
        "work_location": "Pune",
        "year_of_study": 2,
    }, headers=headers_a)

    db_cnt = SessionLocal()
    try:
        drafts_after = db_cnt.execute(
            text("SELECT count(*) FROM interview_posts WHERE user_id = :u AND status = 'draft' AND deleted_at IS NULL"),
            {"u": user_a_id},
        ).scalar()
    finally:
        db_cnt.close()

    passed_inplace = r_pat.status_code == 200 and drafts_after == drafts_before
    record("8. Draft Edit", "PATCH /posts/{id}", "Step-1 re-submit updates draft in place", "200, draft count unchanged", f"{r_pat.status_code}, {drafts_before}->{drafts_after}", passed_inplace, "Back-navigation can never mint duplicate drafts")

    # 8.3 Step-2 re-submit replaces rounds instead of appending duplicates
    r_clear = requests.delete(f"{BASE}/posts/{edit_post_id}/rounds", headers=headers_a)
    r_det2 = requests.get(f"{BASE}/posts/{edit_post_id}", headers=headers_a)
    rounds_after_clear = (r_det2.json() or {}).get("rounds") or []
    r_readd = requests.post(f"{BASE}/posts/{edit_post_id}/rounds", json={
        "name": "Tech Screen", "mode": "online", "duration_minutes": 30,
    }, headers=headers_a)
    r_det3 = requests.get(f"{BASE}/posts/{edit_post_id}", headers=headers_a)
    rounds_final = (r_det3.json() or {}).get("rounds") or []
    passed_replace = (
        r_clear.status_code == 200
        and len(rounds_after_clear) == 0
        and len(rounds_final) == 1
        and rounds_final[0].get("round_number") == 1
        and rounds_final[0].get("duration_minutes") == 30
    )
    record("8. Draft Edit", "DELETE /posts/{id}/rounds", "Step-2 re-submit replaces rounds", "200, 0 then 1 round #1", f"clear={r_clear.status_code}, {len(rounds_after_clear)}->{len(rounds_final)}", passed_replace, "Fixes duplicated rounds and timings when a draft is edited")

    # 8.4 Guardrails: foreign drafts untouched, published rounds immutable,
    #     and draft editing never consumes the 3-edit published budget
    passed_foreign = True
    if b_post_id:
        r_foreign = requests.delete(f"{BASE}/posts/{b_post_id}/rounds", headers=headers_a)
        passed_foreign = r_foreign.status_code in (400, 404)
        foreign_status = r_foreign.status_code
    else:
        foreign_status = "n/a"
    record("8. Draft Edit", "DELETE /posts/{foreign}/rounds", "Clearing someone else's draft", "400/404", foreign_status, passed_foreign, "Prevents cross-user draft tampering")

    requests.put(f"{BASE}/posts/{edit_post_id}/publish", json={
        "experience_text": "Draft editing audit narrative.",
        "is_offer_received": False,
    }, headers=headers_a)
    r_pub_clear = requests.delete(f"{BASE}/posts/{edit_post_id}/rounds", headers=headers_a)
    r_final = requests.get(f"{BASE}/posts/{edit_post_id}", headers=headers_a)
    final_det = r_final.json() if r_final.status_code == 200 else {}
    budget_ok = final_det.get("edit_count") == 0 and final_det.get("edits_remaining") == 3
    passed_lock = r_pub_clear.status_code == 400 and budget_ok
    record("8. Draft Edit", "DELETE /posts/{id}/rounds (published)", "Published rounds immutable; edit budget intact", "400 + 3 edits left", f"delete={r_pub_clear.status_code}, remaining={final_det.get('edits_remaining')}", passed_lock, "Draft editing can never touch published content or the edit budget")

    # Last test on this post has run: out of the public feed immediately
    hide_from_feed(edit_post_id)

    # =========================================================================
    # 7. DATABASE & API ROBUSTNESS (NO 500s)
    # =========================================================================
    # 7.1 Nonexistent resources GET
    r_get_post_fake = requests.get(f"{BASE}/posts/{fake_id}")
    r_get_comp_fake = requests.get(f"{BASE}/companies/{fake_id}")
    r_get_inst_fake = requests.get(f"{BASE}/institutions/{fake_id}")
    r_get_user_fake = requests.get(f"{BASE}/users/{fake_id}")
    passed_get_fake = all(r.status_code in (400, 404) for r in (r_get_post_fake, r_get_comp_fake, r_get_inst_fake, r_get_user_fake))
    record("7. Robustness", "GET [posts|companies|institutions|users]/{fake_id}", "Nonexistent entity GET requests", "404", f"P:{r_get_post_fake.status_code}, C:{r_get_comp_fake.status_code}, I:{r_get_inst_fake.status_code}, U:{r_get_user_fake.status_code}", passed_get_fake, "Ensures clean error responses across all resource lookups")

    # 7.2 Duplicate Company Creation
    company_name = f"DuplicateTest_{uuid.uuid4().hex[:6]}"
    r1 = requests.post(f"{BASE}/companies/", json={"name": company_name, "industry": "Testing"}, headers=headers_a)
    r2 = requests.post(f"{BASE}/companies/", json={"name": company_name, "industry": "Testing"}, headers=headers_a)
    passed_dup = (r1.status_code == 201) and (r2.status_code in (400, 409))
    record("7. Robustness", "POST /companies/", "Duplicate company name conflict handling", "201 then 400/409", f"1st:{r1.status_code}, 2nd:{r2.status_code}", passed_dup, "Prevents database unique constraint crash / 500 error")

    # 7.3 Global 500 Error Check
    any_500 = any(r["actual"] == 500 or "500" in str(r["actual"]) for r in results)
    record("7. Robustness", "All Endpoints", "Absence of unhandled 500 Internal Server Errors", "No 500s", f"Any 500 found: {any_500}", not any_500, "Confirms comprehensive exception handling across all endpoints")

    # Print summary
    print(f"\n{'='*95}")
    print(f"{'CATEGORY':<14} | {'ENDPOINT':<34} | {'RESULT':<6} | {'STATUS':<10} | {'CASE'}")
    print(f"{'='*95}")
    pass_count = 0
    fail_count = 0
    for res in results:
        status_tag = "PASS" if res["passed"] else "FAIL"
        if res["passed"]:
            pass_count += 1
        else:
            fail_count += 1
        print(f"{res['category']:<14} | {res['endpoint']:<34} | {status_tag:<6} | {str(res['actual']):<10} | {res['case']}")

    print(f"{'='*95}")
    print(f"AUDIT SUMMARY: {pass_count} PASSED, {fail_count} FAILED out of {len(results)} tests.")
    print(f"{'='*95}\n")

    # Leave the shared database exactly as we found it — CI runs this on
    # every push against the same DB the site uses.
    removed = cleanup_test_artifacts()
    if removed:
        print(f"cleanup: removed {removed}")

if __name__ == "__main__":
    run_audit()

