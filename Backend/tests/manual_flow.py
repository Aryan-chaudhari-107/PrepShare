
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import requests

BASE = "http://127.0.0.1:8000"

# 1. Login (or auto-register for fresh DB)
from _01_core.database import SessionLocal
from _02_models import User
from _01_core.security import hash_password

db = SessionLocal()
test_user = db.query(User).filter(User.email == "aryan07chaudhari@gmail.com").first()
if not test_user:
    import uuid
    test_user = User(
        id=uuid.uuid4(),
        email="aryan07chaudhari@gmail.com",
        username="aryan_test",
        password_hash=hash_password("Bunny@1234"),
        full_name="Aryan Test User",
        is_active=True,
        is_email_verified=True,
        token_version=1
    )
    db.add(test_user)
    db.commit()
db.close()

resp = requests.post(f"{BASE}/auth/login", json={
    "identifier": "aryan07chaudhari@gmail.com",
    "password": "Bunny@1234",
})
print("LOGIN:", resp.status_code, resp.json())
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Create a post
resp = requests.post(f"{BASE}/posts/", json={
    "post_category": "campus_placement",
    "title": "Test Post via Script",
    "year_of_study": 3,
}, headers=headers)
print("CREATE POST:", resp.status_code, resp.json())
post_id = resp.json()["post_id"]

# 3. Add a round
resp = requests.post(f"{BASE}/posts/{post_id}/rounds", json={
    "name": "Aptitude Test",
    "mode": "offline",
}, headers=headers)
print("ADD ROUND:", resp.status_code, resp.json())
post_round_id = resp.json()["post_round_id"]

# 4. Add a question
resp = requests.post(f"{BASE}/posts/{post_id}/rounds/{post_round_id}/questions", json={
    "question_text": "What is a binary search tree?",
}, headers=headers)
print("ADD QUESTION:", resp.status_code, resp.json())
created_question_id = resp.json().get("question_id")

# 5. Publish the post
resp = requests.put(f"{BASE}/posts/{post_id}/publish", json={
    "experience_text": "I applied through campus placement, cleared aptitude and technical rounds, got the offer.",
    "tips": "Practice DSA basics thoroughly.",
    "is_offer_received": True,
    "job_role": "SDE-1",
    "package_amount": 650000,
    "currency": "INR",
}, headers=headers)
print("PUBLISH POST:", resp.status_code, resp.json())

# 6. Update the draft (before publishing — reorder your script if needed, or create a fresh post to test this)
resp = requests.patch(f"{BASE}/posts/{post_id}", json={"title": "Updated Title"}, headers=headers)
print("UPDATE POST:", resp.status_code, resp.json())


# Share the post (no auth needed)
resp = requests.post(f"{BASE}/posts/{post_id}/share")
print("SHARE POST:", resp.status_code, resp.json())


# 7. Read the post back — public, no auth header
resp = requests.get(f"{BASE}/posts/{post_id}")
print("GET POST:", resp.status_code)
print(json.dumps(resp.json(), indent=2))

# 8. Flip to anonymous, then read again — this is the actual privacy check
resp = requests.patch(f"{BASE}/posts/{post_id}", json={"is_anonymous": True}, headers=headers)
print("GO ANONYMOUS:", resp.status_code, resp.json())

resp = requests.get(f"{BASE}/posts/{post_id}")
body = resp.json()
print("GET ANON POST:", resp.status_code)
print("  author:", body["author"])
print("  slug:", body["slug"])
print("  leaked keys:", [k for k in ("user_id", "username", "profile_photo_url") if k in body] + [k for k in ("education_id", "institution_name", "course_name") if body.get(k) is not None])

# ── Part 0: Feed ──────────────────────────────────────────────────────────────
resp = requests.get(f"{BASE}/posts/", params={"page": 1, "limit": 5})
print("\nFEED (page 1, limit 5):", resp.status_code)
body = resp.json()
print("  total:", body.get("total"), "  total_pages:", body.get("total_pages"))
print("  has_next:", body.get("has_next"), "  has_previous:", body.get("has_previous"))
print("  items count:", len(body.get("items", [])))
if body.get("items"):
    first = body["items"][0]
    print("  first item author:", first.get("author"), "  slug:", first.get("slug"))

# ── Part 1: D1 — owner can read their own draft ───────────────────────────────
resp2 = requests.post(f"{BASE}/posts/", json={
    "post_category": "campus_placement",
    "title": "My Draft Post (D1 test)",
}, headers=headers)
draft_id = resp2.json().get("post_id")
print("\nCREATE DRAFT:", resp2.status_code)

resp3 = requests.get(f"{BASE}/posts/{draft_id}", headers=headers)
print("OWNER READS DRAFT:", resp3.status_code, "(expect 200)")

resp4 = requests.get(f"{BASE}/posts/{draft_id}")
print("STRANGER READS DRAFT:", resp4.status_code, "(expect 404)")

# Part 1: D3 — adding a question with a round from a different post (draft_id with post_round_id from post_id)
resp5 = requests.post(f"{BASE}/posts/{draft_id}/rounds/{post_round_id}/questions", json={
    "question_text": "D3 cross-post attack attempt"
}, headers=headers)
d3_result = "PASS" if resp5.status_code == 400 else "FAIL"
print(f"D3 CROSS-POST ROUND ATTACK: {resp5.status_code} (expect 400) -> {d3_result}")

# ── Part 2: Companies ─────────────────────────────────────────────────────────
resp6 = requests.post(f"{BASE}/companies/", json={
    "name": "Google",
    "industry": "Technology",
    "website": "https://google.com",
}, headers=headers)
if resp6.status_code == 201:
    company_id = resp6.json().get("id")
    print("\nCREATE COMPANY:", resp6.status_code, resp6.json())
else:
    c_res = requests.get(f"{BASE}/companies/", params={"search": "Google"}).json()
    company_id = c_res["items"][0]["id"] if c_res.get("items") else None
    print("\nCOMPANY ALREADY EXISTS, REUSING ID:", company_id)

resp7 = requests.get(f"{BASE}/companies/")
print("LIST COMPANIES:", resp7.status_code, "total:", resp7.json().get("total"))

resp8 = requests.get(f"{BASE}/companies/{company_id}")
print("GET COMPANY:", resp8.status_code, resp8.json().get("name"))

# Create a post referencing the company to confirm FK works end-to-end
resp9 = requests.post(f"{BASE}/posts/", json={
    "post_category": "campus_placement",
    "title": "Google SDE Interview",
    "company_id": company_id,
}, headers=headers)
print("CREATE POST WITH COMPANY_ID:", resp9.status_code)
company_post_id = resp9.json().get("post_id")

# ── Part 5: Public Profile & Posts ────────────────────────────────────────────
me_resp = requests.get(f"{BASE}/users/me", headers=headers)
my_user_id = me_resp.json().get("id")
print("\nGET ME (to get id):", me_resp.status_code, "id:", my_user_id)

pub_profile = requests.get(f"{BASE}/users/{my_user_id}")
print("GET PUBLIC PROFILE:", pub_profile.status_code)
pub_body = pub_profile.json()
print("  username:", pub_body.get("username"))
print("  leaked keys (email, etc):", [k for k in ("email", "password_hash", "is_email_verified") if k in pub_body])

pub_posts = requests.get(f"{BASE}/users/{my_user_id}/posts")
print("GET PUBLIC USER POSTS:", pub_posts.status_code, "total:", pub_posts.json().get("total"))

# ── Part 6: Comments ──────────────────────────────────────────────────────────
c_resp = requests.post(f"{BASE}/posts/{post_id}/comments", json={
    "comment_text": "Great interview experience! Thanks for sharing."
}, headers=headers)
print("\nADD COMMENT:", c_resp.status_code, c_resp.json().get("comment_text"))
comment_id = c_resp.json().get("id")

# Reply to comment
reply_resp = requests.post(f"{BASE}/posts/{post_id}/comments", json={
    "comment_text": "Glad you found it helpful!",
    "parent_comment_id": comment_id,
}, headers=headers)
print("ADD REPLY:", reply_resp.status_code, reply_resp.json().get("comment_text"))

# List comments
list_c = requests.get(f"{BASE}/posts/{post_id}/comments")
print("LIST COMMENTS:", list_c.status_code, "total:", list_c.json().get("total"))

# Edit comment
edit_c = requests.patch(f"{BASE}/comments/{comment_id}", json={
    "comment_text": "Updated: Great interview experience! Very inspiring."
}, headers=headers)
print("EDIT COMMENT:", edit_c.status_code, edit_c.json().get("comment_text"))

# ── Part 7: Likes & Bookmarks ─────────────────────────────────────────────────
# Like post
like_resp = requests.post(f"{BASE}/posts/{post_id}/like", headers=headers)
print("\nLIKE POST:", like_resp.status_code, like_resp.json())

# Check like status
like_status = requests.get(f"{BASE}/posts/{post_id}/like", headers=headers)
print("GET LIKE STATUS:", like_status.status_code, like_status.json())

# Bookmark post
bm_resp = requests.post(f"{BASE}/posts/{post_id}/bookmark", headers=headers)
print("BOOKMARK POST:", bm_resp.status_code, bm_resp.json())

# List bookmarks
bm_list = requests.get(f"{BASE}/users/me/bookmarks", headers=headers)
print("LIST MY BOOKMARKS:", bm_list.status_code, "total:", bm_list.json().get("total"))

# ── Part 8: Difficulty Votes ──────────────────────────────────────────────────
# Vote easy
vote_resp1 = requests.post(f"{BASE}/questions/{created_question_id}/vote", json={"difficulty": "easy"}, headers=headers)
print("\nVOTE EASY:", vote_resp1.status_code, vote_resp1.json())

# Switch vote to hard (easy_count -> 0, hard_count -> 1)
vote_resp2 = requests.post(f"{BASE}/questions/{created_question_id}/vote", json={"difficulty": "hard"}, headers=headers)
print("SWITCH VOTE TO HARD:", vote_resp2.status_code, vote_resp2.json())

# Toggle off vote (hard_count -> 0)
vote_resp3 = requests.post(f"{BASE}/questions/{created_question_id}/vote", json={"difficulty": "hard"}, headers=headers)
print("TOGGLE VOTE OFF:", vote_resp3.status_code, vote_resp3.json())

# ── Part 9: Completed Questions Tracker ───────────────────────────────────────
# Mark question as complete
comp_resp1 = requests.post(f"{BASE}/questions/{created_question_id}/complete", headers=headers)
print("\nMARK COMPLETED:", comp_resp1.status_code, comp_resp1.json())

# List my completed questions
comp_list = requests.get(f"{BASE}/users/me/completed-questions", headers=headers)
print("LIST MY COMPLETED QUESTIONS:", comp_list.status_code, "total:", comp_list.json().get("total"))

# Toggle completed question off
comp_resp2 = requests.post(f"{BASE}/questions/{created_question_id}/complete", headers=headers)
print("TOGGLE COMPLETED OFF:", comp_resp2.status_code, comp_resp2.json())

# ── Part 10: Drafts Resumption & Edit Metadata ────────────────────────────────
drafts_resp = requests.get(f"{BASE}/users/me/drafts", headers=headers)
print("\nLIST MY DRAFTS:", drafts_resp.status_code, "total:", drafts_resp.json().get("total"))

detail_resp = requests.get(f"{BASE}/posts/{post_id}", headers=headers)
print("GET POST DETAIL (edit metadata):", detail_resp.status_code)
d_body = detail_resp.json()
print("  edit_count:", d_body.get("edit_count"), "edits_remaining:", d_body.get("edits_remaining"), "days_left_to_edit:", d_body.get("days_left_to_edit"))

# ── Part 11: Search & Multi-criteria Filtering ────────────────────────────────
filtered_posts = requests.get(f"{BASE}/posts/", params={"search": "Interview", "post_category": "campus_placement"})
print("\nFILTERED POSTS SEARCH:", filtered_posts.status_code, "total:", filtered_posts.json().get("total"))

comp_search = requests.get(f"{BASE}/companies/", params={"search": "Google"})
print("SEARCH COMPANIES:", comp_search.status_code, "total:", comp_search.json().get("total"))

inst_search = requests.get(f"{BASE}/institutions/", params={"search": "Mumbai"})
print("SEARCH INSTITUTIONS:", inst_search.status_code, "total:", inst_search.json().get("total"))

# ── Part 12: User Settings ───────────────────────────────────────────────────
settings_get = requests.get(f"{BASE}/users/me/settings", headers=headers)
print("\nGET USER SETTINGS:", settings_get.status_code, settings_get.json())

settings_patch = requests.patch(f"{BASE}/users/me/settings", json={"theme_preference": "dark"}, headers=headers)
print("PATCH USER SETTINGS (dark):", settings_patch.status_code, settings_patch.json().get("theme_preference"))

# ── Part 13: Follows System ──────────────────────────────────────────────────
# Follow second user (if exists in DB)
from _01_core.database import SessionLocal
from _02_models import User
db_session = SessionLocal()
other_user = db_session.query(User).filter(User.id != my_user_id).first()
db_session.close()

if other_user:
    other_id = str(other_user.id)
    follow_resp = requests.post(f"{BASE}/users/{other_id}/follow", headers=headers)
    print("\nFOLLOW USER:", follow_resp.status_code, follow_resp.json())

    followers_resp = requests.get(f"{BASE}/users/{other_id}/followers")
    print("LIST FOLLOWERS:", followers_resp.status_code, "total:", followers_resp.json().get("total"))

    following_resp = requests.get(f"{BASE}/users/{my_user_id}/following")
    print("LIST FOLLOWING:", following_resp.status_code, "total:", following_resp.json().get("total"))

    unfollow_resp = requests.post(f"{BASE}/users/{other_id}/follow", headers=headers)
    print("UNFOLLOW USER:", unfollow_resp.status_code, unfollow_resp.json())

# ── Part 14: Notifications ───────────────────────────────────────────────────
notifs_resp = requests.get(f"{BASE}/notifications/", headers=headers)
print("\nLIST NOTIFICATIONS:", notifs_resp.status_code, "total:", notifs_resp.json().get("total"), "unread:", notifs_resp.json().get("unread_count"))

read_all_resp = requests.patch(f"{BASE}/notifications/read-all", headers=headers)
print("MARK ALL NOTIFICATIONS READ:", read_all_resp.status_code, read_all_resp.json())

# ── Part 15: Content Moderation & Reports ────────────────────────────────────
# Create a report on another post or draft
if other_user:
    # Find a published post by someone else or create one
    db_session = SessionLocal()
    from _02_models import InterviewPost
    target_post = db_session.query(InterviewPost).filter(InterviewPost.user_id != my_user_id, InterviewPost.status == "published").first()
    db_session.close()
    if target_post:
        rep_resp = requests.post(f"{BASE}/reports/", json={
            "post_id": str(target_post.id),
            "reason": "Suspected spam/inappropriate content."
        }, headers=headers)
        print("\nFILE REPORT:", rep_resp.status_code, rep_resp.json().get("reason"))

print("\nALL FLOWS COMPLETED SUCCESSFULLY!")





