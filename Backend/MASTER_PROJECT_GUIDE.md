# Interview Questions Platform — Master Project Guide (v1 + v2, single source of truth)

> **Purpose:** hand this one file to any AI assistant (or read it yourself later) to get complete context — what this project is, how the database is designed, how the codebase is organized, what's built already, and what's next. This file supersedes and merges the old `PROJECT_GUIDE.md` and `full_roadmap_v1_v2.md` — if you're starting a new AI chat, this is the only file you need to paste in, alongside a zip of the actual project folder.

---

## 🔴 RESUME HERE — exact next steps, in order

The owner is mid-way through building `GET /posts/{post_id}` (reading a full post back, with its rounds and questions). This was paused here. Do these steps **in this exact order**, and after EVERY code change: (a) check if a matching `_0X_.../__init__.py` needs a new import line, (b) test the change loads/runs correctly, (c) remind the owner to commit to GitHub. Don't skip straight to later steps — each one depends on the one before it.

1. **`_04_repositories/posts.py`** — add `get_round_by_id(db, round_id)`, querying `InterviewRound` by `id`. Confirm `InterviewRound` is imported at the top of this file. → check `_04_repositories/__init__.py` → test → remind to commit.
2. **`_05_services/posts.py`** — write `get_post_detail(db, post_id)`: fetch the post + its `post_rounds` (ordered by `round_number`) via `get_post_with_details`, then for each round fetch its `InterviewRound` via the new `get_round_by_id` (NOT `pr.round.name` — no `relationship()` exists between `PostRound` and `InterviewRound`, confirmed, don't add one, just query directly) and its questions via `get_questions_for_round`, assemble into the nested dict shape matching `PostOut`/`RoundOut`/`QuestionOut` from `_03_schemas/posts.py`. **Must implement the anonymous-post identity rule here**: if `post.is_anonymous` is true, never include `user_id`/`username`/`profile_photo_url` anywhere in the returned dict (see §7 open decisions for why — zero identity surface, no exceptions). Also call `increment_view_count`. → check `_05_services/__init__.py` → test → remind to commit.
3. **`_06_routers/posts.py`** — add `GET /{post_id}`, **public** (no `get_current_user` — anyone should be able to view a published post), `response_model=PostOut`. → test via `manual_flow.py` (add a `requests.get(...)` block) → remind to commit.
4. Once confirmed working: continue to Phase 1's remaining ⬜ items in §9, in whatever order the owner prefers — listing/pagination, comments, likes, bookmarks, completed-questions tracker are all still fully unbuilt.

**Also still open from earlier, not forgotten:** `PostRound` model's docstring says it should have `created_at` — this was added and migrated (see §10 gotchas, the `sa.func.now()` server_default fix). If `get_round_by_id` or anything else in this step surfaces a similar "column exists in docstring but not in code" mismatch elsewhere, apply the same fix pattern: add the column, generate migration, check for `NOT NULL` issues against existing rows, add `server_default` if needed.

---

## 1. What this project is

A platform where students post their real interview and hackathon experiences — questions asked, rounds faced, packages offered — so other students can prepare. Core differentiators: crowd-voted question difficulty, a personal "completed questions" prep tracker, and (in v2) duplicate-question detection so the same question doesn't get re-posted endlessly.

**Owner's role:** solo builder, learning as they go. **Every AI assistant helping on this project should explain concepts and let the owner write the actual code themselves — do not hand over finished code blocks unless explicitly asked.**

---

## 2. Tech stack (locked in)

| Layer | Choice |
|---|---|
| Backend language/framework | Python + FastAPI |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Auth | JWT (python-jose), password hashing (passlib/bcrypt) |
| Rate limiting | slowapi (in-memory, per-IP — no Redis needed for v1) |
| Validation | Pydantic |
| Database | PostgreSQL, hosted on **Supabase** (permanent free tier, pgvector-ready) |
| Backend hosting | **Render** (free web service tier) |
| Frontend | React + Tailwind + Axios + react-hook-form (`useFieldArray` for repeatable fields) |
| Charts | Recharts (v1.5/v2 analytics pages) |
| File storage | AWS S3 or Cloudinary — **direct-to-cloud uploads only, never through the backend** |
| ML (v1) | Hugging Face zero-shot classification (no training needed) |
| ML (v1.5) | scikit-learn TF-IDF + Logistic Regression, once real data exists |
| ML (v2) | sentence-transformers + pgvector, for duplicate-question detection |
| Real-time chat (v2) | WebSockets / Socket.io |
| Frontend hosting | Vercel or Netlify (not yet decided which) |
| Version control | GitHub |
| API testing | Postman / FastAPI Swagger docs |

---

## 3. Backend folder structure — Controller-Service-Repository architecture

**Decision: full Controller-Service-Repository pattern**, not routers-do-everything. Every request flows through three distinct layers, each with one job:

- **Repository** (`_04_repositories/`) — talks to the database ONLY. Raw SQLAlchemy queries (get user by id, insert a post, etc). No business rules, no validation, no HTTP knowledge.
- **Service** (`_05_services/`) — the business logic. Calls the Repository to get/save data, applies actual rules (e.g. "job_role only required if is_offer_received," "cap rounds at 15," "aptitude round is now free-form"). Never touches SQLAlchemy directly, never touches HTTP directly.
- **Router / Controller** (`_06_routers/`) — receives the HTTP request, calls the Service, returns the HTTP response. No database access, no business rules — just the front door.

**One request flows top to bottom: Router → Service → Repository → Database**, and the answer flows back up the same chain. Each layer only ever calls the layer directly below it — a router never calls a repository directly, skipping the service.

```
project-root/
├── .env                        ← secrets: DATABASE_URL, SECRET_KEY, ALGORITHM,
│                                   ACCESS_TOKEN_EXPIRE_MINUTES (never committed)
├── .gitignore
├── requirements.txt
├── main.py                     ← FastAPI app entry point, includes all routers
│                                   (unnumbered — uvicorn expects this exact name)
├── alembic.ini                 ← Alembic config, points at DATABASE_URL
│
├── utils/                      ← unnumbered — helpers used ACROSS every layer
│   ├── __init__.py
│   ├── slug_generator.py
│   ├── otp_generator.py
│   └── email_sender.py
│
├── _01_core/
│   ├── __init__.py             ← re-exports settings, get_db, security functions
│   ├── config.py                ← loads .env into a settings object
│   ├── database.py              ← SQLAlchemy engine, session, Base, get_db() dependency
│   └── security.py              ← password hashing + JWT create/verify functions
│
├── _02_models/                 ← one SQLAlchemy class per table, numbered for reading order
│   ├── __init__.py             ← imports EVERY model below — required for Alembic to see them
│   ├── m01_users.py  … m27_company_statistics.py   (27 files, see §4)
│
├── _03_schemas/                ← Pydantic request/response models + conditional validation
│   ├── __init__.py             ← imports every schema below
│   └── (mirrors _02_models/, one file per resource — unnumbered)
│
├── _04_repositories/            ← DATABASE ACCESS ONLY, one file per resource
│   ├── __init__.py
│   └── auth.py, users.py, posts.py, questions.py, comments.py,
│       follows.py, notifications.py, chat.py
│
├── _05_services/                ← BUSINESS LOGIC, one file per resource, calls repositories
│   ├── __init__.py
│   └── auth.py, users.py, posts.py, questions.py, comments.py,
│       follows.py, notifications.py, chat.py
│
├── _06_routers/                 ← API endpoints / controllers, one file per resource, calls services
│   ├── __init__.py             ← imports every router below (cleans up main.py)
│   └── auth.py, users.py, posts.py, questions.py, comments.py,
│       follows.py, notifications.py, chat.py
│
├── tests/                      ← unnumbered — pytest suite, parallel to the app
│   └── __init__.py
│
└── alembic/                     ← name fixed by the tool — created by `alembic init`,
                                     do not rename or renumber this one
```

**Naming note:** `_01_`, `_02_`… prefixes on folders and `m01_`, `m02_`… on model files are purely for reading order — Python resolves imports by name, not number, so nothing breaks if this isn't followed strictly. It's there so a human (or an AI) can read top to bottom and see the actual build order AND the actual request flow: core has to exist before anything can talk to the database → models define what's stored → schemas define what's allowed in/out of the API → repositories do raw DB queries → services apply business rules on top of repositories → routers tie it all together into HTTP endpoints. Folders start with `_` (not a digit) because Python identifiers can't start with a number; model files use `m` since `_01_users.py` inside an already-underscored folder gets visually noisy.

`main.py`, `utils/`, `tests/`, and `alembic/` are **deliberately not numbered** — they aren't steps in the build sequence.

### The `__init__.py` rule — non-negotiable, not just tidiness

Every numbered folder (`_01_core`, `_02_models`, `_03_schemas`, `_04_repositories`, `_05_services`, `_06_routers`) — plus `utils/` and `tests/` as plain Python packages — needs an `__init__.py`. This does two things:

1. **Convenience** — lets you write `from _02_models import User` instead of drilling into `_02_models.m01_users`.
2. **Required for Alembic** — Alembic's autogenerate only detects a table if its model class has actually been imported somewhere Python runs. If you create `m27_something_new.py` and forget to add its import line to `_02_models/__init__.py`, Alembic will silently generate no migration for it — no error, it just won't exist as far as the database is concerned.

**Working rule going forward: every time a new file is added to any of the six numbered folders, the matching `__init__.py` gets one new import line in the same sitting — not "later."**

A full scaffold with every one of these `__init__.py` files (and TODO-stub files for every model/schema/repository/service/router) has already been generated for you — see the delivered `project-root.zip`.

---

## 4. Complete database schema (28 tables, finalized for v1+v2)

Conditional-required validation lives in the **API layer** (Pydantic schemas), not the database. Junction tables (`likes`, `bookmarks`, `completed_questions`) get `UNIQUE(user_id, target_id)`; `comments` does not, since one user can post many.

```
1. USERS
-------------------------
id                  UUID PK
email               varchar UNIQUE, indexed
username            varchar UNIQUE, indexed
password_hash       varchar
full_name           varchar
bio                 text
profile_photo_url   text
role                enum(student, admin, moderator, working_professional)
contribution_score  integer DEFAULT 0        -- cache, see contribution_events (#25)
follower_count      integer DEFAULT 0        -- cache, updated on follow/unfollow
following_count     integer DEFAULT 0        -- cache, updated on follow/unfollow
is_active           boolean DEFAULT true
is_email_verified   boolean DEFAULT false   -- NEW: false until OTP verification
                    -- completes at signup. Login is blocked while this is false.
created_at          timestamp
updated_at          timestamp

2. USER_SETTINGS
-------------------------
id                  UUID PK
user_id             FK users.id UNIQUE, ON DELETE CASCADE
theme_preference    enum(light, dark, system) DEFAULT system
created_at          timestamp
updated_at          timestamp

3. OTPS
-------------------------
id                  UUID PK
user_id             FK users.id, nullable, ON DELETE CASCADE
                    -- nullable because email_verification OTPs are requested
                    -- BEFORE any user row exists — see email below.
email               varchar, nullable
                    -- used for purpose = email_verification, where there's
                    -- no user_id yet to attach to. For purpose = password_reset,
                    -- user_id is used instead (that user already exists) and
                    -- this stays null. Exactly one of user_id / email is set,
                    -- never both, never neither — enforced in the API layer.
purpose             enum(password_reset, email_verification)
                    -- CHANGED from PASSWORD_RESET_OTPS: generalized to serve
                    -- both purposes with one table instead of two near-identical
                    -- ones — same mechanism (hash, expire, one-time-use) either way.
otp_code_hash       varchar        -- store hashed, never plain
expires_at          timestamp
is_used             boolean DEFAULT false
created_at          timestamp

4. LOGIN_SESSIONS
-------------------------
id                  UUID PK
user_id             FK users.id, ON DELETE CASCADE
refresh_token_hash  varchar
device              varchar, nullable
ip_address          varchar, nullable
expires_at          timestamp
created_at          timestamp

5. INSTITUTIONS
-------------------------
id                  UUID PK
name                varchar, indexed
city                varchar
state               varchar, nullable   -- not every country has "states"; optional for intl institutions
country             varchar
type                enum(college, university, institute)
website             text
created_at          timestamp

-- CHANGED from original single `location varchar` field: split into city/state/country
-- so location becomes a real filterable field (Phase 2 search/filters, v2 insight pages)
-- instead of free text that would need fragile ILIKE parsing.

6. EDUCATION_HISTORY
-------------------------
id                  UUID PK
user_id             FK users.id, ON DELETE CASCADE
degree_level        enum(Diploma, Bachelors, Masters, PhD)
institution_id      FK institutions.id
course              varchar
branch              varchar
education_type      enum(full_time, part_time, online)
start_year          integer
end_year            integer
is_current          boolean DEFAULT false
created_at          timestamp
updated_at          timestamp

7. COMPANIES
-------------------------
id                  UUID PK
name                varchar UNIQUE, indexed
slug                varchar UNIQUE   -- for URLs e.g. /companies/google
logo_url            text
website             text
industry            varchar
created_at          timestamp
updated_at          timestamp

8. INTERVIEW_POSTS
-------------------------
id                  UUID PK
user_id             FK users.id, ON DELETE CASCADE
company_id          FK companies.id, nullable, indexed   -- nullable for hackathons with no sponsor
education_id        FK education_history.id, nullable
post_category       enum(campus_hackathon, off_campus_hackathon,
                         campus_placement, off_campus_placement)
                    -- CHANGED: "aptitude" removed as a standalone category.
                    -- round_type already has an "aptitude" value (see table 9) —
                    -- a person who only did an aptitude round posts a normal
                    -- campus_placement / off_campus_placement with exactly one
                    -- round (round_type: aptitude) and simply leaves job_role/
                    -- package_amount blank if they didn't clear it further.
title               varchar
slug                varchar UNIQUE
year_of_study       integer, nullable          -- campus only, e.g. 3 (point-in-time, not on the user's profile)
age                 integer, nullable          -- point-in-time, same reasoning as year_of_study
experience_years    numeric, nullable          -- off-campus: years of prior work experience
current_status      enum(student, fresher, working_professional), nullable   -- off-campus: what they were doing before this
work_location       varchar, nullable          -- specific office/city (a company can have many offices)
work_mode           enum(remote, onsite, hybrid), nullable
is_offer_received   boolean DEFAULT false      -- controls whether job_role/package/currency are shown & required
job_role            varchar, nullable   -- e.g. "SDE-1", "Backend Intern" — required only if is_offer_received
package_amount      numeric, nullable  -- required only if is_offer_received
currency            varchar, nullable  -- required only if is_offer_received
experience_text     text
tips                text, nullable     -- one closing tip from the poster
is_anonymous        boolean DEFAULT false
status              enum(draft, published, flagged)
published_at        timestamp, nullable   -- NEW: set when status flips to published.
                    -- Tracks the actual publish moment separately from created_at,
                    -- since a draft can sit unpublished for any length of time —
                    -- the 3-day post-publish edit window (see below) counts from
                    -- THIS, not from when the draft was first created.
edit_count          integer DEFAULT 0     -- NEW: how many times edited AFTER
                    -- publishing (draft edits don't count — unrestricted while
                    -- still a draft, since nobody's seen it yet). Capped at 3.
deleted_at          timestamp, nullable   -- soft delete, preserves who/when/history
view_count          integer DEFAULT 0
created_at          timestamp, indexed
updated_at          timestamp

-- Post-publish edit rule (API layer, not enforced in the database):
-- once status = published, further edits are allowed ONLY IF both:
--   (a) less than 3 days have passed since published_at, AND
--   (b) edit_count < 3
-- Each successful post-publish edit increments edit_count by 1.
-- Drafts remain freely editable with no time/count limit.
-- Certain fields (post_category, company_id, education_id) stay locked
-- even during the allowed edit window — see §5/§10 for the full rule.

-- Conditional validation (API layer):
--   campus_placement      -> education_id required, year_of_study shown
--   off_campus_placement  -> education_id optional, experience_years + current_status shown instead
--   campus_hackathon      -> education_id required
--   off_campus_hackathon  -> education_id optional
--   job_role / package_amount / currency (both interview categories) -> only
--     required/shown if is_offer_received = true; someone who only went
--     through an aptitude/early round and didn't clear it leaves these blank

9. INTERVIEW_ROUNDS
-------------------------
id                  UUID PK
name                varchar, nullable   -- optional free-text label the student
                    types, e.g. "Aptitude Test", "Viva", "Technical Interview" —
                    or left blank, in which case the frontend just shows
                    "Round 1", "Round 2", etc. from post_rounds.round_number.
                    -- CHANGED: round_type enum REMOVED. A fixed dropdown
                    -- (aptitude/hr/technical/...) only made sense for tech
                    -- placements. To keep this platform field-agnostic
                    -- (medical, commerce, core engineering, any field),
                    -- rounds are now just numbered + freely labeled by the
                    -- student, and topic classification happens via ML
                    -- reading each question's actual content (see
                    -- question_tags, #13) — not a preset round category.

10. POST_ROUNDS
-------------------------
id                  UUID PK
post_id             FK interview_posts.id, ON DELETE CASCADE
round_id            FK interview_rounds.id
round_number        integer   -- order within this post
mode                enum(online, offline)   -- CHANGED: moved here from interview_posts.
                    -- Each round of a post can independently be online or
                    -- offline (e.g. HR round was in-person, technical round
                    -- was a video call) — a single post-level field couldn't
                    -- capture that, so mode lives per-round instead.
created_at          timestamp

11. INTERVIEW_QUESTIONS
-------------------------
id                  UUID PK
post_id             FK interview_posts.id, ON DELETE CASCADE
post_round_id       FK post_rounds.id, nullable
                    -- named post_round_id (not round_id) to avoid ambiguity:
                    -- post_rounds.round_id points to interview_rounds, this
                    -- points to post_rounds — same short name would've meant
                    -- two different target tables under one name.
question_text       text, nullable
attachment_url      text, nullable   -- PDF or image
is_verified         boolean DEFAULT false   -- company employee/alumni can verify "yes, actually asked"
easy_count          integer DEFAULT 0    -- cached from question_difficulty_votes,
medium_count        integer DEFAULT 0    -- updated atomically (same transaction as the vote)
hard_count          integer DEFAULT 0
embedding           vector, nullable   -- populated in v2 for duplicate detection (pgvector)
created_at          timestamp
updated_at          timestamp

-- Validation: at least one of question_text / attachment_url required.
-- CHANGED: the old "aptitude round = attachment only, no text" special case
-- is removed along with round_type — every round now follows the same
-- uniform rule (text and/or attachment, either or both), since rounds are
-- no longer categorized into a fixed set that could be special-cased.

12. QUESTION_DIFFICULTY_VOTES
-------------------------
id                  UUID PK
question_id         FK interview_questions.id, ON DELETE CASCADE
user_id             FK users.id, ON DELETE CASCADE
difficulty          enum(easy, medium, hard)
created_at          timestamp
UNIQUE(question_id, user_id)   -- one vote per user per question
-- vote insert and the matching *_count increment on interview_questions MUST happen
-- in a single DB transaction, so a failed counter update can never desync from the vote.

13. QUESTION_TAGS
-------------------------
id                  UUID PK
name                varchar UNIQUE   -- e.g. "DSA", "Cardiology", "Cost Accounting",
                    "Thermodynamics" — ANY topic, any field. Open-ended, ML-assigned
                    (see Phase 5, §9) based on actual question content, not a
                    preset CS-only list. Editable by the poster afterward.
-- tag hierarchy (parent/child, e.g. DSA > Array) deferred to a future version

14. QUESTION_TAG_MAP
-------------------------
question_id         FK interview_questions.id, ON DELETE CASCADE
tag_id               FK question_tags.id, ON DELETE CASCADE
PRIMARY KEY(question_id, tag_id)

15. HACKATHONS
-------------------------
id                  UUID PK
post_id             FK interview_posts.id UNIQUE, ON DELETE CASCADE
name                varchar
theme               varchar
level               enum(college, state, national)   -- national = country-wide event
host_institution_id FK institutions.id, nullable      -- shown only if level = college
state               varchar, nullable                 -- shown only if level = state
country             varchar, nullable                 -- shown only if level = national
eligibility_text    text, nullable   -- which degree(s)/branches could participate
location            varchar, nullable   -- venue city, or "Virtual"
position            varchar                            -- kept: overall position/outcome text
rank_achieved       varchar, nullable   -- e.g. "Top 10", "Winner", "3rd place"
team_size           integer
prize_amount        numeric, nullable
problem_statement_text              text, nullable
problem_statement_attachment_url    text, nullable   -- either/both allowed
evaluation_questions  text, nullable   -- questions asked during evaluation
tips                text, nullable    -- general tips
created_at          timestamp

16. HACKATHON_PHASES
-------------------------
id                  UUID PK
hackathon_id        FK hackathons.id, ON DELETE CASCADE
phase_number        integer   -- order: Phase 1, Phase 2, ...
phase_type          enum(idea_pitch, building, evaluation, other)
mode                enum(online, offline)   -- this phase's mode, independent of other phases
description         text, nullable   -- what happened in this phase
created_at          timestamp
-- NEW table: a hackathon isn't one flat event — e.g. Phase 1 (idea pitch)
-- might be online, Phase 2 (building) offline, Phase 3 (evaluation) online
-- again. Repeatable per-hackathon, same shape as post_rounds is to
-- interview_posts, but with a phase_type instead of a round_type.

17. COMMENTS
-------------------------
id                  UUID PK
post_id             FK interview_posts.id, ON DELETE CASCADE
user_id             FK users.id, ON DELETE CASCADE
comment_text        text
parent_comment_id   FK comments.id, nullable   -- null = top-level, set = a reply (replies are core v1)
created_at          timestamp, indexed
updated_at          timestamp
-- comment count: computed via COUNT(*) WHERE post_id = X (cache later only if it gets slow)

18. LIKES
-------------------------
id                  UUID PK
user_id             FK users.id, ON DELETE CASCADE
post_id             FK interview_posts.id, ON DELETE CASCADE
created_at          timestamp
UNIQUE(user_id, post_id)

19. BOOKMARKS
-------------------------
id                  UUID PK
user_id             FK users.id, ON DELETE CASCADE
post_id             FK interview_posts.id, ON DELETE CASCADE
created_at          timestamp
UNIQUE(user_id, post_id)

20. COMPLETED_QUESTIONS
-------------------------
id                  UUID PK
user_id             FK users.id, ON DELETE CASCADE
question_id         FK interview_questions.id, ON DELETE CASCADE
completed_at        timestamp
UNIQUE(user_id, question_id)
-- public/private visibility of this list: still an open decision (see §6)

21. REPORTS
-------------------------
id                  UUID PK
reporter_id         FK users.id
post_id             FK interview_posts.id, ON DELETE CASCADE
reason              text
status              enum(pending, reviewed, resolved) DEFAULT pending
created_at          timestamp

22. FOLLOWS
-------------------------
id                  UUID PK
follower_id         FK users.id, ON DELETE CASCADE
following_id        FK users.id, ON DELETE CASCADE
created_at          timestamp
UNIQUE(follower_id, following_id)
-- profiles are fully public: follower/following counts always visible, no private profile mode

23. NOTIFICATIONS
-------------------------
id                  UUID PK
receiver_id         FK users.id, ON DELETE CASCADE, indexed
sender_id           FK users.id, nullable
type                enum(LIKE, COMMENT, FOLLOW, NEW_POST)
reference_id        UUID
reference_type      enum(post, comment, user)   -- tells you which table reference_id points to
is_read             boolean DEFAULT false
created_at          timestamp

24. CONVERSATIONS
-------------------------
id                  UUID PK
user_one_id         FK users.id
user_two_id         FK users.id
created_at          timestamp
UNIQUE(user_one_id, user_two_id)
-- API layer must always store the smaller UUID as user_one_id (prevents duplicate
-- reversed-order conversations). 1:1 only, no group chat.

25. MESSAGES
-------------------------
id                  UUID PK
conversation_id     FK conversations.id, ON DELETE CASCADE
sender_id           FK users.id
message_text        text
is_read             boolean DEFAULT false   -- drives red (unseen) / green (seen) dot in UI
created_at          timestamp, indexed

26. CONTRIBUTION_EVENTS
-------------------------
id                  UUID PK
user_id             FK users.id, ON DELETE CASCADE
event_type          varchar   -- e.g. "post_created", "question_added", "helpful_comment"
points              integer
reference_id        UUID, nullable
created_at          timestamp
-- users.contribution_score is a CACHE kept in sync by summing these events — auditable.

27. COMPANY_STATISTICS  (future / v2+)
-------------------------
company_id          FK companies.id PK
total_interviews    integer
avg_package         numeric
popular_topics      jsonb
updated_at          timestamp

28. MESSAGE_BLOCKS
-------------------------
id                  UUID PK
blocker_id          FK users.id, ON DELETE CASCADE — who is doing the blocking
blocked_id          FK users.id, ON DELETE CASCADE — who is blocked
created_at          timestamp
UNIQUE(blocker_id, blocked_id)
-- NEW table, v2 scope (same phase as conversations/messages). Appended at
-- the END of the numbering (not inserted earlier) so existing model files
-- m26_contribution_events.py / m27_company_statistics.py never needed
-- renaming — the file will be m28_message_blocks.py.
-- DECIDED: blocking is MESSAGING-ONLY, deliberately minimal — does NOT hide
-- the blocked user's posts from your feed, does NOT hide your profile from
-- them, does NOT affect follows/likes/comments/anything else. The only
-- effect: blocked_id can no longer send messages to blocker_id. This
-- avoids building full cross-feature blocking (feed filtering, comment
-- hiding, etc.) for v1/v2 — matches hard rule #5, ship the simplest
-- version. Same self-referencing double-FK-to-users shape as `follows`.

-- Inbox UI (frontend, not new schema — computed by filtering `conversations`):
-- three categories: (1) Blocked — conversations with someone in MESSAGE_BLOCKS,
-- shown for management/unblocking; (2) Requests — conversations with someone
-- NOT in a follow relationship with you (neither follows the other) — kept
-- separate from the main inbox to reduce spam visibility, similar to a
-- "message requests" folder; (3) Follower/Following — conversations with
-- someone you follow or who follows you, your normal known-contacts inbox.
-- A spammy stranger in "Requests" gets moved to "Blocked" from within that
-- chat — that's the ONLY thing blocking does; their posts/profile remain
-- fully visible everywhere else, unaffected.
```

---

## 5. New post creation flow (UX logic)

When a user creates a post, they pick **one of 4 categories first** — this single choice drives every field shown afterward:

- `campus_hackathon`
- `off_campus_hackathon`
- `campus_placement`
- `off_campus_placement`

(There is deliberately no standalone "aptitude" category — see the note on `post_category` in §4. An aptitude-only experience is just an interview post with a single round.)

**Shared first step (interview + hackathon categories):** pick campus or off-campus.
- Campus → qualification selector shown, college/course derived automatically through `education_id → education_history → institutions` (never a free-typed college field).
- Off-campus → no college shown at all.

**Interview post fields, campus:**
college/course (auto-filled) → year_of_study → age (optional) → company (select or add new) → work_location → work_mode (Remote/Onsite/Hybrid) → **offer received? (yes/no toggle)** → if yes: job_role, package_amount, currency; if no: skip straight to rounds.

**Interview post fields, off-campus:**
company → degree (optional link to education_history) → age → experience_years → current_status (Student/Fresher/Working Professional) → work_location → work_mode → **offer received? (yes/no toggle)** → if yes: job_role, package_amount, currency; if no: skip straight to rounds.

**Then, for both campus and off-campus interview posts — rounds (repeatable, numbered):**
No fixed dropdown of round types — this keeps the platform usable for any field, not just tech placements. The poster adds **Round 1, Round 2, Round 3...** as needed, optionally typing a short label for each (e.g. "Aptitude Test," "Viva," "Case Study," "Practical Exam" — whatever fits their field; label can be left blank). For each round, they also pick that round's **mode: Online or Offline** — independent per round, since e.g. one round could've been in-person while another was a video call. For each round's questions: text and/or file attachment, either or both, no restriction — the old "aptitude = file-only" special case is gone along with the fixed round-type list. Topic tagging (e.g. "DSA," "Cardiology," "Cost Accounting") happens automatically via ML reading the actual question content (§9 Phase 5) — not from the round's label. Difficulty is *not* set by the poster on any question — it's crowd-voted later by readers.

Because a post supports multiple numbered rounds each with their own mode and questions, **one post can represent an entire journey** — Round 1 cleared (online) → Round 2 (offline) → Round 3 (online) → placement — all under a single post, rendered round-by-round.

**How rounds actually get saved (incremental, not one big form):** the post is created as soon as step 1 (company/college/etc.) is filled, immediately as `status: draft`. The user fills one round, submits it, then is asked "Add another round?" — Yes loops back to pick/fill the next round (in **whatever order they want**, no fixed sequence enforced — `round_number` just records the order they actually added them in); No finalizes the post as-is and flips `status` to `published`. If they close the app mid-way without finishing, the draft **persists and is resumable** later (this is a web app — no reason to lose their progress). This means a single post can end up with 1 round or all of them, and the whole "journey" — however many rounds they choose to include — is what gets shown as one post on the dashboard.

Finally: **experience_text** (free write-up) and one optional closing **tip** from the poster.

**Hackathon post fields (campus or off-campus):**
name, theme → level (College/State/National) → if College: which college; if State: which state; if National: which country → eligibility_text (which degrees/branches) → team_size → location (venue or Virtual) → problem statement (text and/or PDF — the actual challenge given) → **phases (repeatable):** for each phase, pick a phase type — Idea Pitch, Building, Evaluation, Other — and that phase's mode (Online/Offline) independently, plus a short description (e.g. "Phase 1: pitched idea online via Zoom", "Phase 2: 24hr on-site build") → experience write-up (5-6 lines) → rank_achieved → prize_amount → evaluation_questions → tips.

**Post editing rules (after publishing):**
- **Freely editable while `status=draft`** — no limits at all, nobody's seen it yet.
- **Once `status=published`, editing is limited:** allowed only within **3 days of `published_at`**, and only **3 times total** (`edit_count`, incremented on each successful post-publish edit). After either limit is hit, the post is permanently locked from further edits.
- **Locked forever, even during the allowed window:** `post_category`, `company_id`, `education_id` (changing these would make it a different post than what people already engaged with), and `slug` (never editable at all, protects existing links/bookmarks).
- **Freely editable within the window/count limit:** `title`, `year_of_study`, `age`, `experience_years`, `current_status`, `work_location`, `work_mode`, `experience_text`, `tips`, `job_role`, `package_amount`, `currency`, `is_offer_received` (if flipped to true during an edit, the same job_role/package/currency-required rule from publishing applies again).
- **Exception, always free regardless of window/count:** switching `is_anonymous` to `true`. Privacy/safety shouldn't be gated by an edit counter meant for typo-fixing — see §7 open decisions for the reasoning.
- **Frontend responsibility (not yet built):** before showing the edit form, display remaining edits / days left (or "this post can no longer be edited") — needs `edits_remaining` / `days_left_to_edit` as computed fields once `GET /posts/{post_id}` is built.

---

## 6. Frontend UX notes (from wireframes)

Captured here so Phase 4 (frontend build) has a clear reference — these are UI/interaction rules, not schema changes; the underlying tables already support all of this.

**Difficulty voting (per question):**
- Below each individual question: 3 small buttons — Easy / Medium / Hard — with that question's current count shown beneath each (from `interview_questions.easy_count/medium_count/hard_count`).
- **Single-select per user, per question** — a user can only have one active vote on a given question at a time (enforced by `question_difficulty_votes` having `UNIQUE(question_id, user_id)`).
- **Toggle/reverse behavior:** if a user taps a difficulty they already selected, it un-votes (reverses) — tapping Easy when Easy is already their selection removes their vote entirely, decrementing that count back down. Tapping a *different* difficulty while one is already selected should move their vote (decrement the old bucket, increment the new one), not stack a second vote.
- With posts containing multiple questions (e.g. 12 questions across several rounds), this repeats per-question — every question gets its own independent 3-button widget, not one rating for the whole post.

**Comment section — split view on open:**
- Tapping/opening the comment section on a post triggers a **layout change**, not a modal/overlay: the left panel (comments) expands larger, and a right panel shows the post's questions/rounds content.
- Both panels scroll **independently** of each other.
- Both panels have their own separate content — comments on the left don't affect or scroll with the question/rounds content on the right, and vice versa.

**Floating nav (top-right, per wireframe):**
- Profile (view/edit), Post (create new), Settings, and Chat — four floating icons. Exact vertical order/placement not yet decided (deferred).

**Repeatable question boxes within a round (how IDs work — no schema change, just clarifying the flow):**
- Inside a round (e.g. "Coding Round 1"), the poster can add any number of question boxes via a repeatable "+ Add question" pattern (`react-hook-form`'s `useFieldArray`, already in the stack — §2).
- The poster never types or picks an ID for anything. When a round is added to a post, that round instance auto-generates its own `post_rounds.id`. When each question box is saved, it auto-generates its own `interview_questions.id` (via `default=uuid.uuid4` — a fresh random UUID per row, no collisions possible).
- What links everything back together correctly is the foreign keys already on the model: each question row carries `post_id` + `round_id`, so all 12 questions in "Coding Round 1" of one post all point back to that same post and that same round instance.
- Each question then gets its own independent Easy/Medium/Hard voting (see above) — a post with multiple rounds and many questions per round ends up as one post, broken into rounds, each round broken into individually-identified, individually-rated questions.

---

## 7. Open decisions (not yet locked in)

- **`completed_questions` visibility**: private by default recommended (only the user sees their own list; optionally a public count like the contribution score — e.g. "47 questions completed" — without exposing the full list). Full public list deferred to v1.5/v2 with a privacy toggle if wanted.
- **Profile navigation tabs**: rough shape discussed — 1) Profile (bio, education/work, contribution score), 2) Add Question / My Posts, 3) Completed Questions (with company/category/round filters), 4) Settings (theme toggle, account). Exact breakdown to be finalized once schema for user-facing data is laid out.
- **Tag hierarchy** (parent/child tags, e.g. DSA > Array): deferred, not needed for v1.
- **Full `organization_id` abstraction** (unifying companies, hackathon committees, colleges as one entity type): skipped for v1 in favor of a simpler nullable `company_id` — revisit only if hackathon-hosting orgs become a bigger feature.
- **v2 follow-system sequencing**: notifications for "new post from followed user" *requires* the follow system to exist first. Two options: (a) build a minimal follow system as part of v2 Phase C even though full follow UX (feed, discovery) is deferred, or (b) ship v2 notifications without that trigger type first (likes/comments only) and add the follow trigger once follows exist. Decide when you get there — either is fine.
- **DECIDED (REVISED — earlier version of this note was wrong, caught during review): anonymous posts have ZERO identity surface, no exceptions.** An anonymous post's API response must never include the poster's `user_id`, `username`, or `profile_photo_url` anywhere — not the main post payload, not comments made by the OP on their own post (once comments are built), nowhere. **No "message the poster" feature exists for anonymous posts, period** — since profiles are always public (no private profile mode, per the FOLLOWS table note), even a single click revealing a username would let a reader immediately visit that person's full public profile, undoing anonymity entirely with zero effort. The earlier idea ("DM reveals identity, but the poster controls whether they reply") was flawed — opening a conversation typically shows the other person's identity immediately, before any reply happens, so it offered no real protection. This is now correctly the simple, safe v1 answer: **anonymous means genuinely untraceable through the post, full stop** — not a "soft" anonymity that can be bypassed by one interaction. A more sophisticated relay-messaging system (where messages route through the platform without ever exposing the real account) could theoretically solve this later, but is real added complexity, not v1 scope.
- **DECIDED: switching a post to anonymous is a free action, exempt from the post-edit limit** (see §5 "Post editing rules") — privacy/safety shouldn't be blocked by having "used up" edits on unrelated typo fixes, or by the 3-day window having expired.

---

## 8. v1 hard rules (never violate these)

1. Never route file uploads through the backend — direct-to-cloud (S3/Cloudinary) only, backend only stores the resulting URL.
2. Never store package/salary as free text — numeric field always.
3. Paginate every list endpoint from day one.
4. Conditional-required validation lives in the API layer (Pydantic), never the database.
5. Ship the simplest ML version first (Hugging Face zero-shot) — don't train a custom classifier before real data exists.
6. Cap rounds per post at 15 (API-layer validation, not a DB constraint) — generous enough for any real interview process, prevents junk/spam rounds.
7. Rate-limit any abuse-prone endpoint (anything that sends an email, or checks a password) using `slowapi`, keyed by IP. Minimum: `/auth/request-otp` at 3/minute, `/auth/login` at 5/minute. Apply the same pattern to any future endpoint with similar risk (e.g. forgot-password OTP request).

---

## 9. v1 phase-by-phase roadmap and current status

- **Phase 0 — Schema & Planning** ✅ **DONE.** Full 28-table schema finalized (§4 above). Note: 27 tables are migrated into the live database as of this writing; `message_blocks` (#26) is v2 scope, schema-designed but not yet migrated — add it when v2 chat is actually built.
- **Phase 1 — Backend Core + Auth** 🔶 **IN PROGRESS — most of the foundation is done.**
  - ✅ `.env` created — `DATABASE_URL` (Supabase **Session pooler** connection, see §13 for why), `SECRET_KEY`, `ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES`, plus `SMTP_HOST/PORT/USERNAME/PASSWORD` (Gmail, App Password)
  - ✅ Folder scaffold + Controller-Service-Repository architecture (`_04_repositories`, `_05_services`, `_06_routers` — see §3)
  - ✅ All 27+ SQLAlchemy models built, tested, and migrated (`_02_models/m01_...` through `m27_...`)
  - ✅ `_01_core/database.py` — engine, session, Base, `get_db` dependency
  - ✅ `_01_core/config.py` — loads `.env` via Pydantic `Settings`
  - ✅ `_01_core/security.py` — password hashing (bcrypt via passlib), JWT create/verify
  - ✅ `_01_core/dependencies.py` — **`get_current_user`**, the reusable auth-gate dependency every protected endpoint uses
  - ✅ Alembic fully working — connected to Supabase, one clean squashed migration (history was reset once early on for a fresh start, see §13)
  - ✅ **Auth — fully built and tested end-to-end, real email delivery confirmed working:**
    1. `POST /auth/request-otp` — body `{email}`. Rejects if email already registered. Generates an `otps` row (`purpose=email_verification`, `email` set, `user_id` null — no user exists yet), sends the real OTP via Gmail SMTP (`utils/email_sender.py`). No user row created at this step.
    2. `POST /auth/verify-and-register` — body `{email, otp_code, username, password, full_name}`. Validates the OTP (matches email, unused, unexpired) — if valid, creates the `User` row **right here**, already `is_email_verified=true`, hashes the password, marks the OTP used, returns the access token. This is the actual moment an account is created — nothing exists before this succeeds.
    3. `POST /auth/login` — body `{identifier, password}`, where `identifier` is EITHER an email or a username (checks for `@` to decide which lookup to use). Rejects with 403 if somehow `is_email_verified` is false (safety net; shouldn't be reachable given the flow above), 401 for wrong credentials.
    - There is **no plain `/auth/signup` endpoint** — it was fully replaced by the two-step OTP flow above. If you see references to `UserSignup`/`signup()` anywhere, that's stale — the correct schemas are `RequestOTP` / `VerifyAndRegister`.
  - ✅ `otps` table (generalized from the original `password_reset_otps` — one table, `purpose` enum handles both `email_verification` and `password_reset`)
  - ✅ **First protected endpoint working: `GET /users/me`** — proves `get_current_user` works end-to-end (token → verified real user → filtered response via `UserProfile` schema, `password_hash` never leaks out)
  - ✅ Rate limiting (`slowapi`, per-IP) on `/auth/request-otp` (3/min), `/auth/login` (5/min), `/auth/forgot-password` (3/min) — see hard rule #7
  - ✅ Logging — `_01_core/logger.py`, `RotatingFileHandler` writing to `logs/app.log` (gitignored) + console. Log lines added at every meaningful auth event: OTP sent, duplicate-email rejection, registration completed, login success/failure, password reset/change completed. Pattern: `from _01_core import logger`, then `logger.info(...)` / `logger.warning(...)` at each meaningful branch in a service function.
  - ✅ **Forgot-password + change-password — both built and tested:**
    - `POST /auth/forgot-password` — body `{email}`. Reuses `otps` with `purpose=password_reset`, `user_id` set (not `email`, since this user already exists — opposite of the registration OTP). Returns the SAME generic message whether or not the email is registered ("If that email is registered, an OTP has been sent") — deliberate, prevents email enumeration. Rate-limited 3/min.
    - `POST /auth/reset-password` — body `{email, otp_code, new_password}`. Validates the OTP, updates `password_hash` via a new repository function `update_password` (in `_04_repositories/auth.py`).
    - `PUT /users/change-password` (protected, in the `users` resource not `auth`) — body `{current_password, new_password}`. For when you're already logged in and know your current password — no OTP needed, since being logged in already proves identity. Reuses the same `update_password` repository function from `_04_repositories/auth.py` (imported into `_05_services/users.py` — note it lives in the `auth` repository file, not `users`, since it was built there first; this is a known minor architectural wart, not a bug).
  - ⬜ Rest of `users` resource — view someone else's public profile by id (would need `get_user_by_id` used for an actual endpoint, not just internally)
  - ✅ **Posts — full incremental creation + editing + sharing flow built and tested end-to-end:**
    - `POST /posts/` — creates a draft post (`status=draft`, `experience_text=""` placeholder), auto-generates `slug` via `utils/slug_generator.py` (lowercase-hyphenated title + random hex suffix, no DB uniqueness check needed given the collision odds — matches hard rule #5)
    - `POST /posts/{post_id}/rounds` — adds a round (creates `interview_rounds` + linking `post_rounds` row together in one repository call), auto-increments `round_number`, enforces ownership + draft-only + the 15-round cap (hard rule #6)
    - `POST /posts/{post_id}/rounds/{post_round_id}/questions` — adds a question to a specific round, enforces "at least one of question_text/attachment_url" at the service layer (hard rule #4 in action — the DB columns are both nullable, the service is what refuses both-empty)
    - `PUT /posts/{post_id}/publish` — final step: fills `experience_text`/`tips`, conditionally requires `job_role`/`package_amount`/`currency` only if `is_offer_received=true`, flips `status` to `published`, sets `published_at`
    - `PATCH /posts/{post_id}` — **update, works on both drafts (unrestricted) and published posts (limited)**. See full rule set in §5 "Post editing rules." Uses `data.model_dump(exclude_unset=True)` so only explicitly-sent fields get touched (critical for correct PATCH semantics — without this, unsent fields would wrongly get wiped to `None`), and `setattr(post, key, value)` in the repository to apply an arbitrary set of field updates dynamically.
    - `POST /posts/{post_id}/share` — the first fully public (no `get_current_user` dependency) endpoint — anyone, logged in or not, can increment `share_count`. Frontend calls this alongside any share action (WhatsApp link, copy-link, internal share) — the endpoint doesn't care which method triggered it.
    - A manual end-to-end test script exists at `tests/manual_flow.py` (uses `requests`, not `pytest` — logs in once, chains all calls with the real token, prints each response) — much faster than re-testing through Swagger UI by hand every time; add one more block here whenever a new endpoint is built. Currently covers: login → create → add round → add question → publish → update → share.
  - ⬜ `GET /posts/{post_id}` or `/posts/{slug}` — reading a post back (nothing can be viewed yet, only created/edited). Paused mid-build: needs manual assembly in the service layer (post + its rounds + each round's questions, from 3 separate tables) since `from_attributes` alone can't map the nested structure — and needs to confirm whether `PostRound` has a `relationship()` to `InterviewRound` set up, or whether that needs adding, before `pr.round.name`-style access works. **Must also correctly implement the anonymous-post identity-hiding rule from §7 when built** — never include `user_id`/`username`/`profile_photo_url` for an anonymous post's author, anywhere in the response.
  - ⬜ Listing posts / dashboard feed, paginated (hard rule #3)
  - ⬜ Core CRUD endpoints still needed: education/work history, comments, likes, bookmarks (all repositories/services/routers still TODO stubs for these resources)
  - ⬜ Completed-questions tracker: `completed_questions` table + `POST /questions/{id}/complete` + `GET /users/{id}/completed-questions?company=&category=&round_type=&page=` (small enough to fold into this phase, no separate phase needed)
  - ⬜ `message_blocks` table (#28) — **schema designed, model built (`m28_message_blocks.py`), migrated into the live database** — but no repository/service/router built yet. Needed once v2 chat is built; see §4 table 28 and §7 for the full "messaging-only block" design.
- **Phase 2 — Search & Filters** ⬜ not started. Query-param filters (company, college, category, round type), combinable via SQLAlchemy `WHERE`, basic `ILIKE` search, pagination everywhere.
- **Phase 3 — File Uploads** ⬜ not started. Direct-to-cloud (S3/Cloudinary) via signed URLs from frontend; backend stores only the URL.
- **Phase 4 — Frontend** ⬜ not started. Auth pages, paginated dashboard feed, multi-step post form, profile page with tabs (Profile / Add Question / Completed Questions / Settings), post detail page, search/filter UI.
- **Phase 5 — ML Categorization** ⬜ not started. v1: Hugging Face zero-shot classification, per-question, no training needed. v1.5: once real data exists, train TF-IDF + Logistic Regression on labeled posts. **Decision: ML-suggested tags are editable by the poster** — the model auto-populates `question_tag_map` on question creation, but the user can add/remove tags afterward. This also means v1.5's training data will include human-corrected labels, not just raw model output, which improves the eventual custom classifier.
- **Phase 6 — Deployment** ⬜ not started. Backend → Render. DB → Supabase. Frontend → Vercel/Netlify.
- **Phase 7 — Admin & Moderation** ⬜ not started. `reports` table (already in schema, #21) + admin-only review endpoint (direct DB query is fine at this scale), basic posting rate-limit to prevent spam.

---

## 10. Development conventions & workflow notes (read this before writing any code)

This section exists so any AI (or future-you) picking up this project mid-way understands not just *what* exists, but *how* things are built and *why* — the recurring patterns, the gotchas already hit and fixed, and the exact request-flow shape every feature follows.

### The layer-calling rule — never skip a layer

Every feature follows: **Router → Service → Repository → Database**, strictly top-down. A router never queries the database directly; a service never touches SQLAlchemy `db.query(...)` itself. The one exception: `_01_core/dependencies.py`'s `get_current_user` does its own DB lookup (fetching the authenticated user), because it's infrastructure that runs *before* any router/service/repository chain even starts — by the time a service receives `current_user`, that data is already fetched, so the repository is legitimately skipped for anything that only needs "who's asking," not "look something else up." A repository lookup only re-enters the picture when a service needs data *beyond* the current user (e.g. viewing someone else's profile).

### The `__init__.py` rule, precisely

- **`_02_models/__init__.py` MUST have every model imported by name** — this is the one non-negotiable case, because Alembic's autogenerate only sees a table if its model has been imported somewhere Python actually runs. Forgetting this causes a *silent* failure (no error, migration just doesn't include the table).
- **Every other `__init__.py`** (`_01_core`, `_03_schemas`, `_04_repositories`, `_05_services`, `_06_routers`, `utils`) — real imports are optional convenience, not required. `_01_core/__init__.py` currently DOES re-export everything (`settings`, `get_db`, `Base`, `engine`, security functions, `get_current_user`) since those get used constantly everywhere. The other four (`_03_schemas` through `_06_routers`) can either stay as plain docstrings (files get imported directly by name, e.g. `from _05_services import auth`) or re-export — **pick one style and stay consistent**; mixing causes confusing stale-import bugs (this happened twice already — an old `from _05_services import auth` reference lingered in `_06_routers/__init__.py` at one point, and a stale `signup`/`UserSignup` import lingered in `_05_services/__init__.py` after the OTP rework — both caused `ImportError`/`AttributeError` that looked like the wrong file's problem until traced to the `__init__.py` itself).

### Schema (Pydantic) filtering — when and how it applies

`response_model=SomeSchema` on a router's decorator is the ONLY place a response schema gets applied — never called manually anywhere in the code. It runs **last**, after the full router→service→repository chain returns a raw SQLAlchemy object, filtering it down to only the fields declared in the schema class right before turning it into JSON. This is how sensitive fields (`password_hash`, etc.) never leak into API responses even though the raw object carries them the entire way through the chain. Any Pydantic schema reading directly from a SQLAlchemy object (not a dict) needs `class Config: from_attributes = True`.

### After EVERY code change — the standing 3-step checklist

This applies to literally every edit, not just big features. The AI assisting should proactively walk through this after each change, not wait to be asked:

1. **`__init__.py` check** — does the folder this file lives in need a new import line? (Mandatory for `_02_models`; optional-but-check-consistency for `_03_schemas`/`_04_repositories`/`_05_services`/`_06_routers` — see the precise rule earlier in this section.) Also check every OTHER file that might call the thing you just added/renamed — renames especially, see the gotcha below about `update_draft_post` → `update_post_details` touching 3 separate files.
2. **Test it** — model: `python -c "from _02_models import X; ..."`. Service: `python -c "from _05_services import auth; ..."`. Full endpoint: restart uvicorn, run `tests/manual_flow.py` (add a new block for the new endpoint if one doesn't exist yet).
3. **Remind the owner to commit to GitHub** — `git add .`, a clear commit message describing what changed, `git push`. The owner has git set up already (see the earlier `git pull --allow-unrelated-histories` / merge conflict resolution in this project's history) — this is just a reminder to actually do it regularly, not a new setup step.

### Testing pattern used throughout

1. After writing/editing a model: `python -c "from _02_models import X; print(X.__tablename__)"`
2. After writing/editing a service: `python -c "from _05_services import auth; print('loaded OK')"`
3. Full endpoint testing: `uvicorn main:app` (plain, no `--reload` — see gotchas below), then `http://127.0.0.1:8000/docs` (Swagger UI) — for protected endpoints, use the **"Authorize" button** (paste just the raw token, no "Bearer" prefix) after logging in via `/auth/login`.
4. When `/docs` shows stale/wrong data that doesn't match the actual code: check `http://127.0.0.1:8000/openapi.json` directly (search for the field in question) to rule out browser caching before assuming the code is wrong — this has been the actual cause more than once.
5. **`tests/manual_flow.py`** — a plain script (uses `requests`, NOT `pytest`) that logs in once, chains real API calls together using the actual returned ids (post_id, post_round_id, etc.), and prints every response. Much faster than re-clicking through Swagger for a multi-step flow like posts (login → create → add round → add question → publish). Run with `python tests/manual_flow.py` while `uvicorn main:app` is running in a separate terminal. **Add one more block to this same script every time a new endpoint is built** — don't start a second script. This is a development convenience, not a real automated test suite (no assertions, no CI) — a proper `pytest` + `TestClient` suite is still a future `tests/` addition, not yet started.
6. Token expiry during dev: `ACCESS_TOKEN_EXPIRE_MINUTES` was temporarily raised (e.g. to `1440` / 24h) in `.env` to avoid re-logging-in constantly while testing manually through Swagger. **Remember to set this back to something reasonable (e.g. `60`) before ever deploying** — this is a dev-only convenience, not a real security setting.

### Known gotchas already hit and fixed (don't re-debug these from scratch)

- **Supabase direct-connection hostname (`db.<ref>.supabase.co`) fails to resolve on most home networks** (IPv6-only, most ISPs are IPv4). Fix: use the **Session pooler** connection string instead (`aws-X-<region>.pooler.supabase.com:5432`, found via the project's "Connect" button → Direct Connection → Session pooler, NOT tucked in a Settings sub-page). This is the permanent, correct `DATABASE_URL`.
- **`passlib` + newer `bcrypt` versions are incompatible** (`AttributeError: module 'bcrypt' has no attribute '__about__'`). Fix: pin `bcrypt==4.0.1` and `passlib==1.7.4` in `requirements.txt`, not `passlib[bcrypt]`.
- **`datetime.utcnow()` is deprecated** — project uses a custom `utc_now()` helper in `utils/` instead, imported wherever a timestamp default is needed (`default=utc_now`, `onupdate=utc_now` — no parentheses, same rule as `uuid.uuid4`).
- **Adding a `NOT NULL` column to a table that already has rows fails** (`NotNullViolation`) unless given a `server_default`, OR the table is empty. When this happened on `is_email_verified`, the fix chosen was wiping the (test-only) database and squashing all migrations into one clean "initial schema" migration — reasonable for a project still in active schema flux with only test data, NOT a technique to use once real user data exists.
- **PowerShell doesn't have `head`** (that's Unix) — use `Select-Object -First N` or just skip piping if checking short output.
- **uvicorn `--reload` on Windows sometimes serves a stale process after a crash** — full fix is `Ctrl+C` to fully stop, clear `__pycache__` (`Get-ChildItem -Recurse -Include __pycache__ | Remove-Item -Recurse -Force`), then restart.
- **`OAuth2PasswordBearer` renders a username/password login FORM in Swagger's "Authorize" dialog** — wrong for this project, since `/auth/login` expects a JSON body `{identifier, password}`, not OAuth2's form-encoded flow. Fixed by switching `_01_core/dependencies.py` to use **`HTTPBearer`** + `HTTPAuthorizationCredentials` instead — this shows a simple "paste your raw token" field, matching how tokens are actually issued and sent in this project (`Authorization: Bearer <token>`, unchanged either way). Only `dependencies.py` needed to change — every file that does `Depends(get_current_user)` was unaffected, since none of them know or care how the dependency verifies identity internally.
- **On at least one occasion, `uvicorn main:app --reload` started, logged "Application startup complete," then immediately logged "Shutting down" / "Application shutdown complete" with no `Ctrl+C` in between** — while `openapi.json` kept showing stale (older) content, even after killing all processes on port 8000 (confirmed empty via `netstat -ano | findstr :8000`) and clearing `__pycache__`. Root cause not fully identified (possibly a file-watcher conflict specific to that machine/setup). **Workaround that resolved it: run without `--reload`** — plain `uvicorn main:app` — which stayed running normally. Tradeoff: requires a manual `Ctrl+C` + restart after every code change instead of auto-reloading. If `--reload` starts silently self-terminating again, this is the fallback — don't spend time re-diagnosing from scratch first, just switch to plain `uvicorn main:app` and move on.
- **When adding a new function to an existing repository/service file, double check WHICH file it actually lives in before importing it elsewhere** — e.g. `update_password` was built in `_04_repositories/auth.py` (for the forgot-password flow) but later needed by `_05_services/users.py` (for change-password). The correct import is `from _04_repositories.auth import update_password`, NOT `from _04_repositories.users import update_password` — importing from the wrong-but-similarly-named file is an easy mistake that produces a confusing `ImportError` naming the right function but the wrong source file.
- **When RENAMING a function, grep/search for every place it's called, not just the file being edited.** `update_draft_post` was renamed to `update_post_details` (to support editing published posts, not just drafts) — this required updates in THREE separate places: the function definition itself, `_05_services/__init__.py`'s import list, AND `_06_routers/posts.py`'s call site. Missing any one of these three produces a real but confusing error (`ImportError` or `AttributeError`) that only surfaces when that specific endpoint is actually called, not at the point of the rename itself. A rename is never "one edit" — treat it as "edit the definition, then search the whole codebase for every reference to the old name."
- **`utc_now()` (the custom timestamp helper) returns a timezone-AWARE datetime; a `DateTime` column read back from Postgres comes back timezone-NAIVE** (no tzinfo attached), even though it's actually stored as UTC. Subtracting one from the other raises `TypeError: can't subtract offset-naive and offset-aware datetimes`. Fix: `post.published_at.replace(tzinfo=timezone.utc)` before comparing/subtracting against `utc_now()` — this doesn't change the actual moment in time, just labels the naive value as UTC so the subtraction is allowed. Came up specifically in the post-edit-window calculation (`(utc_now() - post.published_at).days`); watch for the same issue anywhere else a stored timestamp gets compared against a freshly-generated one.

### Enum-heavy schema — naming convention

Every SQLAlchemy `Enum(...)` column has an explicit `name="..."` argument (e.g. `name="post_status"`, `name="otp_purpose"`) — Postgres requires named enum types, and consistent naming here avoids collisions when multiple enum columns exist across different tables.

---

## 11. v2 roadmap — "smarter data quality + real community"

**v2 features (locked in for next milestone, after v1 ships):**

1. Duplicate question detection
2. Chat/DMs between students
3. Notifications (likes, comments, follows, new posts from followed users)

Most required tables for these already exist in the finalized 28-table schema (#22 follows, #23 notifications, #24 conversations, #25 messages, #26 message_blocks) — `message_blocks` still needs an actual Alembic migration when you get here (it's designed but not yet in the live database), everything else is just building the endpoints/logic on tables that already exist.

### Phase A — Duplicate Detection
- Add **pgvector** extension to PostgreSQL (Supabase is pgvector-ready).
- On question creation, generate an embedding via **sentence-transformers**.
- Store embedding in `interview_questions.embedding` (already in schema, #11).
- Before final submission, run a cosine-similarity search against existing questions for the same company.
- If similarity exceeds threshold, show: "Similar question already posted — view it?" (non-blocking warning, not a hard stop).

### Phase B — Chat / DMs
- Scope tightly for v2: **1:1 only**, text-only (no group chat, no media attachments yet).
- Uses `conversations` + `messages` tables (#23, #24) — already designed, including the "always store smaller UUID as user_one_id" rule to prevent duplicate reversed conversations.
- Real-time delivery via **WebSockets** (or Socket.io).
- Basic UI: conversation list + message thread. No read receipts/typing indicators yet (defer to v2.5) — `messages.is_read` drives a simple red/green seen-dot only.

### Phase C — Notifications
- Uses `notifications` table (#22) — already designed: `type enum(LIKE, COMMENT, FOLLOW, NEW_POST)`, `reference_id` + `reference_type` to point at the right row.
- Triggered on: comment created, like added, follow added, new post from followed user.
- In-app only for v2 — bell icon + dropdown, no email/push yet.
- Mark-as-read on click; simple unread count badge.
- **Dependency:** "new post from followed user" needs the follow system (`follows` table, #21) built first — see the sequencing decision in §6.

### v2 parking lot (beyond the 3 locked-in features — for v2.x/v3 planning, not yet scheduled)
- Full follow-system UX (feed, discovery) — minimal follow table/endpoints get pulled forward into Phase C per §6
- Public leaderboard (contribution score is already public, so this becomes easy to add)
- Share-card generator for LinkedIn/WhatsApp (highest-leverage growth feature — strong candidate for v2.5)
- Company/college insight & analytics pages (core differentiator — prioritize soon after v2 chat/notifications ship)
- Upvote/downvote beyond simple likes
- Verified/corroborated badge system
- Trusted moderator roles per college
- Practice mode / personal prep list / mock interview scheduler
- Monetization: sponsored spotlights, premium analytics for placement cells, API access

---

## 12. Hosting decisions

- **Database:** Supabase (permanent free Postgres tier, pgvector-ready for v2). Used purely as a connection string — its Auth/Storage/instant-API features are intentionally unused since this project has its own JWT auth.
- **Backend:** Render free web service tier (spin-down after inactivity is acceptable during development).
- **Frontend:** Vercel or Netlify (not yet decided which).
- **Files:** AWS S3 or Cloudinary, direct-to-cloud only.
- **Version control / CI trigger:** GitHub.

---

## 13. How to use this file with an AI assistant

Paste this entire file at the start of any new AI chat about this project. It contains:
- Full tech stack (§2) — don't suggest swapping tools without a strong reason.
- Folder structure + the `__init__.py` rule, including the Controller-Service-Repository layers (§3).
- The complete, finalized schema (§4) — don't redesign tables, just implement them.
- Current build status with checkmarks (§9) — pick up exactly where the ⬜/🔶/✅ markers leave off. As of the last update: environment, all models, Alembic, and full auth (OTP-gated registration + login) are done; `GET /users/me` is the first working protected endpoint; everything else in Phase 1 onward is still ⬜.
- **Development conventions & workflow notes (§10) — read this before writing or reviewing any code.** Covers the layer-calling rule, the precise `__init__.py` rules, how schema filtering actually applies, the testing pattern used throughout, and a list of real gotchas already hit and fixed (Supabase pooler, bcrypt/passlib version pin, stale `__init__.py` imports, NOT NULL migration failures, uvicorn stale-reload) — don't re-debug these from scratch.
- v1 hard rules (§8) — non-negotiable constraints.
- **Reminder for the AI:** explain concepts, don't hand over finished code blocks unless explicitly asked — the owner is learning by writing the code themselves. (Note: this rule has been relaxed at points in the actual build when the owner explicitly asked for code directly — follow whatever the owner asks for in the moment, this default just applies absent other instruction.)
