# HANDOFF — PrepShare Platform Backend

Written 2026-08-26. Read this top to bottom before writing any code.

The authoritative spec is **`MASTER_PROJECT_GUIDE.md`** (28-table schema, business
rules, decided/open questions). It is **not currently in this repo** — it lives at
`C:\Users\ASUS\Downloads\MASTER_PROJECT_GUIDE (3).md`. Copy it into the repo root
and commit it before starting, or you will be working without the spec.

This document covers: what exists, the non-negotiable conventions, known defects,
and the remaining work split into independently-completable parts.

---

## 1. Stack and layout

| | |
|---|---|
| Framework | FastAPI 0.141.1 |
| ORM | SQLAlchemy 2.0.51 |
| Validation | Pydantic 2.13.4 (v2 semantics) |
| DB | PostgreSQL on Supabase (**Session pooler** connection) |
| Migrations | Alembic — current head `3e36f6771974` |
| Auth | JWT via `HTTPBearer` (**not** `OAuth2PasswordBearer`) |
| Rate limiting | slowapi, in-memory, per-IP |
| Python | 3.13, venv at `./venv` |

Numbered packages, strict layering:

```
_01_core/        config, database, security, dependencies, logger, rate_limiter
_02_models/      m01..m28 SQLAlchemy models
_03_schemas/     Pydantic request/response schemas
_04_repositories/  raw SQLAlchemy queries ONLY
_05_services/    business logic ONLY
_06_routers/     HTTP layer ONLY
utils/           utc_now, slug_generator, otp_generator, email_sender
tests/manual_flow.py   end-to-end script (requests, not pytest)
```

`_04_routers/` is gone — it was renamed to `_06_routers/`. Ignore any reference to it.

---

## 2. Non-negotiable conventions

### 2.1 Never skip a layer
`Router → Service → Repository → Database`, always. A router never calls
`db.query(...)`. A service never touches SQLAlchemy query construction. The only
sanctioned exception is `_01_core/dependencies.py::get_current_user`, which does
its own lookup because it runs before the chain starts.

### 2.2 The `__init__.py` rule
- `_02_models/__init__.py` **must** import every model by name. Alembic
  autogenerate only sees imported models. Forgetting one fails **silently** — no
  error, the table just isn't in the migration.
- All other packages re-export by name. This project has chosen the re-export
  style; stay consistent.
- **This has caused four separate `ImportError`s already**, always the same shape:
  the name in `__init__.py` doesn't match the name in the module. The traceback
  names the *module* (where the name was looked for), not `__init__.py` (where it
  was typed wrong). `posts.py` deliberately mixes singular and plural —
  `get_post_detail` (one post) vs `get_posts_feed` (many) — so neither is
  guessable. Copy names, don't retype them.

### 2.3 Verify with `import main`, not individual names
```bash
.\venv\Scripts\python.exe -c "import main; print('APP LOADS OK')"
```
Routers → services → repositories → models, so this exercises every
`__init__.py` transitively. Run it after every file you touch.

### 2.4 The anonymous-post rule (spec §7, DECIDED — zero exceptions)
An anonymous post's API response **must never** contain the poster's `user_id`,
`username`, or `profile_photo_url`, anywhere, at any nesting depth. Also never
`education_id`. There is no "message the poster" feature for anonymous posts.

How this is currently enforced, and how to keep enforcing it:

- **Nested `AuthorOut | None`, not flat nullable fields.** `author: None` is the
  only representation of anonymous. This is fail-closed: `interview_posts` has no
  `author` column, so no accidental `{**post.__dict__}` spread can populate it.
  A flat `username: str | None` would be fail-*open* — one careless spread fills it.
- **Reuse `AuthorOut`.** Both `PostOut` and `PostListItem` use the same class.
  Any new post-returning schema must reuse it too. It has no optional identity
  fields, so a half-populated author is unrepresentable.
- **`slug` must be `None` when `is_anonymous`.** The slug is generated once from
  the original title and never regenerated, so it can still contain a real name
  the poster has since edited out. See defect D4.
- **Never `{**post.__dict__, ...}`.** Both existing assemblers write every field
  out by hand. That is an explicit allow-list and it is the point. `response_model`
  is a second allow-list, but do not rely on it alone.
- **Omitting a dict key does NOT omit it from the JSON.** Verified empirically:
  Pydantic fills the field default and emits `"user_id": null`. The key's absence
  from your dict is not a privacy mechanism.

> ⚠️ The rule is currently enforced by **per-endpoint discipline**, duplicated in
> `get_post_detail` and `get_posts_feed`. It is not a property of the system. Every
> new post-returning endpoint must re-implement both the author suppression and the
> slug suppression. Consider extracting a single shared assembler.

### 2.5 Other hard rules (spec §8)
1. Never route file uploads through the backend — direct-to-cloud only, store the URL.
2. Never store salary as free text — numeric always.
3. **Paginate every list endpoint from day one.**
4. Conditional-required validation lives in Pydantic/service, never the DB.
5. Ship the simplest ML version first.
6. Cap rounds per post at 15 — API-layer check, not a DB constraint.
7. Rate-limit anything that sends email or checks a password, keyed by IP.
   Minimum: `/auth/request-otp` 3/min, `/auth/login` 5/min, `/auth/forgot-password` 3/min.

### 2.6 Timestamps
Use `utils.utc_now`, never `datetime.utcnow()` (deprecated). `utc_now()` returns
timezone-**aware**; a `DateTime` column read back from Postgres is timezone-**naive**.
Subtracting them raises `TypeError`. Fix at the read site:
```python
post.published_at.replace(tzinfo=timezone.utc)
```

### 2.7 Session behaviour
`sessionmaker(autocommit=False, autoflush=False, bind=engine)` — **no
`expire_on_commit=False`**. So `expire_on_commit` defaults to `True`: any ORM
object loaded *before* a `commit()` is expired and re-`SELECT`ed on next access,
one row at a time. If a function both writes and reads, do the write **first**.
`get_post_detail` depends on this — its `increment_view_count` call is above the
rounds loop for exactly this reason. Don't reorder it.

### 2.8 Pagination shape
Offset-based, 1-based `page`, matching the spec's `?page=` convention.
`offset = (page - 1) * limit`. Order by a unique tiebreaker as the last sort key
or offset paging can duplicate or skip rows. A page past the end returns
`items: []`, **not** 404.

### 2.9 Environment
`.env` (gitignored, never commit) holds `DATABASE_URL`, `SECRET_KEY`,
`ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `SMTP_HOST/PORT/USERNAME/PASSWORD`.

> ⚠️ `ACCESS_TOKEN_EXPIRE_MINUTES` was temporarily raised to `1440` (24h) for
> convenience during development. **Set it back to `60` before any deployment.**

### 2.10 Windows / PowerShell
The dev shell is PowerShell 5.1. `&&` is invalid — use `;` or separate lines.
`head` does not exist. Run the server as plain `uvicorn main:app` (no `--reload`;
there is a known unresolved stale-process problem with it).

---

## 3. What is built and working

### Auth — complete, tested end-to-end, real email delivery confirmed
Two-step OTP registration. **There is no `/auth/signup`** — any reference to
`UserSignup`/`signup()` is stale.

| Endpoint | Notes |
|---|---|
| `POST /auth/request-otp` | 3/min. Rejects already-registered email. Creates an `otps` row (`purpose=email_verification`, `email` set, `user_id` null). No user row yet. |
| `POST /auth/verify-and-register` | The actual account-creation moment. Validates OTP, creates `User` already `is_email_verified=true`, returns token. |
| `POST /auth/login` | 5/min. `identifier` is email **or** username — decided by checking for `@`. 403 if unverified, 401 on bad credentials. |
| `POST /auth/forgot-password` | 3/min. `purpose=password_reset`, `user_id` set. Returns the **same generic message** whether or not the email exists — deliberate, prevents enumeration. Do not "improve" this. |
| `POST /auth/reset-password` | Validates OTP, calls `update_password`. |

OTPs are stored **hashed, never plain**.

### Users — partial
| Endpoint | Notes |
|---|---|
| `GET /users/me` | Protected. Proves `get_current_user` works. `password_hash` filtered out by `UserProfile`. |
| `PUT /users/change-password` | Protected. No OTP — being logged in proves identity. Reuses `update_password` from `_04_repositories/auth.py` (known minor architectural wart: a users concern living in the auth repository. Leave it.) |

### Posts — creation, editing, sharing, single-post read all working
| Endpoint | Auth | Notes |
|---|---|---|
| `POST /posts/` | yes | Creates draft (`status=draft`, `experience_text=""`), auto-generates slug |
| `POST /posts/{post_id}/rounds` | yes | Creates `interview_rounds` + `post_rounds` together, auto `round_number`, 15-round cap |
| `POST /posts/{post_id}/rounds/{post_round_id}/questions` | yes | Requires at least one of `question_text`/`attachment_url` (service-layer, both columns nullable) |
| `PUT /posts/{post_id}/publish` | yes | Conditionally requires `job_role`/`package_amount`/`currency` iff `is_offer_received` |
| `PATCH /posts/{post_id}` | yes | Works on drafts (unrestricted) and published (limited). `model_dump(exclude_unset=True)` + `setattr` |
| `POST /posts/{post_id}/share` | **no** | Fully public. Increments `share_count`. |
| `GET /posts/{post_id}` | **no** | Nested post + rounds + questions. Anonymity enforced. |

**Post editing rules (spec §5), implemented in `update_post_details`:**
- Drafts: freely editable, no limits.
- Published: only within **3 days** of `published_at` **and** only **3 times**
  total (`edit_count`).
- `LOCKED_AFTER_PUBLISH = {post_category, company_id, education_id}` — permanently
  unchangeable once published.
- **Flipping `is_anonymous` is free** — exempt from both the window and the count.
  Implemented as `set(updates.keys()) == {"is_anonymous"}` at
  `_05_services/posts.py:167`. Privacy must never be blocked by having used up
  edits on typos. Keep this exemption.

### Models — all 28 built and migrated
`m01..m28`. All 28 tables are in the live database, including `m28_message_blocks`
(v2 scope, no repository/service/router yet).

### Migrations
```
9f9c96aa35ca  initial_schema
b7b7f6f1ef19  add share_count to posts, add message_blocks
402ddc5d251d  add published_at and edit_count to posts
3e36f6771974  add created_at to post_rounds   <- HEAD
```
History was reset once early on for a clean start. Don't try to reconstruct
anything before `9f9c96aa35ca`.

### Testing
`tests/manual_flow.py` — 73 lines, uses `requests`, not pytest. Logs in once and
chains every call with the real token, printing each response. Covers: login →
create → add round → add question → publish → update → share → **read back** →
**flip anonymous and re-read**.

**Add a block to this script for every endpoint you build.** It is the only test
suite that exists. Note `requests` is not in `requirements.txt` — add it under `# Dev`.

### Logging
`_01_core/logger.py`, `RotatingFileHandler` → `logs/app.log` (gitignored) + console.
Pattern: `from _01_core import logger`, then `logger.info(...)` / `logger.warning(...)`
at each meaningful branch in a **service** function. See defect D2.

---

## 4. Known defects and deferred work

Ordered by severity. All are real and verified, none are speculative.

| ID | Severity | Defect |
|---|---|---|
| **D1** | High | **Authors cannot read their own drafts.** `get_post_detail` 404s anything where `status != "published"`, including for the owner. So a draft can be created and then never viewed, which makes the whole incremental-creation flow unusable from a UI. Correct for strangers, but there is no owner path. Fix needs an *optional*-auth dependency (`get_current_user_optional`), which does not exist yet. See Part 1. |
| **D2** | High (privacy) | **`logs/app.log` records `post_id` → `user_id` for every post with no anonymity check.** `_05_services/posts.py` lines 53, 132, 181 log `by user {current_user.id}`. Anyone with log access can de-anonymize every anonymous post. The §7 rule says zero identity surface; logs are a surface. |
| **D3** | High | **`add_question_to_round` never verifies the round belongs to the post.** It checks post ownership, then passes `post_round_id` straight through. Any authenticated user who owns *any* post can attach questions to *another* post's round by passing that round's id. |
| **D4** | Medium (privacy) | **Slug leaks names permanently.** Generated once from the title at draft creation (`_05_services/posts.py:31`), never regenerated, and **not** in `LOCKED_AFTER_PUBLISH`. Publish "Aryan Chaudhari - Google SDE-1", then edit the title and flip anonymous: the slug still says `aryan-chaudhari-google-sde-1-a48f2c` forever. Currently mitigated **read-side only** (returned as `None` when anonymous) in both endpoints. Write-side fix: regenerate on title change, and force an opaque slug when `is_anonymous` flips true. |
| **D5** | Medium | **3 published posts have `published_at IS NULL`** — rows predating migration `402ddc5d251d`. Postgres sorts `DESC` as NULLS **FIRST**, so they pin to the top of the feed above every real post. Read path is guarded with `.nullslast()`; the data still needs backfilling (`published_at = created_at`) or deleting (they're throwaway test rows). |
| **D6** | Medium | **N+1 in `get_post_detail`.** One query per round for the round name, plus one per round for its questions. A 15-round post is ~33 queries. Batch with two `IN` queries. |
| **D7** | Medium | **`view_count += 1` and `share_count += 1` are non-atomic** read-modify-writes. Concurrent requests lose counts. Use `UPDATE ... SET view_count = view_count + 1`. |
| **D8** | Low | **No index on `published_at`**, which the feed now sorts by. `created_at` is indexed; `published_at` isn't. Needs a migration. |
| **D9** | Low | **Fingerprinting.** Exact `age` + `package_amount` + `company_id` + `work_location` on an anonymous post is enough to correlate it against the same person's identified posts. `PostOut` exposes all four. `PostListItem` deliberately omits `age`, `year_of_study`, `experience_years`, `work_location` to avoid *bulk* enumeration via pagination. This is a product decision for the owner, not a bug — but any new post-returning endpoint should follow `PostListItem`'s lead, not `PostOut`'s. |
| **D10** | Cosmetic | Typo: `_04_repositories/posts.py:48` parameter is `attachement_url` (should be `attachment_url`). Works only because every caller passes positionally — a keyword call will break. |
| **D11** | Cosmetic | `class Config: from_attributes = True` emits `PydanticDeprecatedSince20`. Migrate to `model_config = ConfigDict(from_attributes=True)` in `_03_schemas/posts.py` and `_03_schemas/users.py` together. |
| **D12** | Cosmetic | Stale docstrings: `m09_interview_rounds.py` describes a removed `round_type` enum; `m11_interview_questions.py` describes a removed aptitude special-case; `main.py` and several repository/service files still carry `TODO:` blocks describing work that's done. |

---

## 5. Remaining work, split into parts

Each part is independently completable and independently testable. **Do them in
order** — Parts 0–3 unblock everything after them.

For every part: add a block to `tests/manual_flow.py`, run
`.\venv\Scripts\python.exe -c "import main; print('APP LOADS OK')"`, run the
script, and commit.

---

### Part 0 — Finish `GET /posts` (the feed). ~15 minutes.

**Everything except the route exists.** `get_published_posts` +
`count_published_posts` (`_04_repositories/posts.py`), `get_users_by_ids`
(`_04_repositories/users.py`), `PostListItem` + `PostListResponse`
(`_03_schemas/posts.py`), and `get_posts_feed` (`_05_services/posts.py`) are all
written and import-clean. Only `_06_routers/posts.py` is missing its route.

Add `PostListResponse` to the schema import on line 10, and `Query` to the fastapi
import. Then add this route — **it must go ABOVE the existing `@router.get("/{post_id}")`
at line 88**:

```python
@router.get("/", response_model=PostListResponse)
def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return posts.get_posts_feed(db, page=page, limit=limit)
```

Three things:
- **Declaration order is load-bearing.** FastAPI matches routes top-down. This
  route is `/` so it wouldn't actually collide with `/{post_id}` — but any future
  *static* path like `GET /posts/drafts` or `GET /posts/trending` **must** be
  declared above `/{post_id}`, or `{post_id}` swallows it and returns a UUID
  parse error.
- `ge=1` on `page` stops a negative page producing a negative SQL `OFFSET`.
  `le=50` on `limit` stops `?limit=100000` from being a trivial DoS. Both are
  enforced by FastAPI before the service runs.
- No `try/except`. `get_posts_feed` raises nothing — an empty page is a valid
  200, not an error.

**Also in Part 0:** backfill D5. Set `published_at = created_at` for the 3 rows
where `status = 'published' AND published_at IS NULL`, or delete them (they are
throwaway `Test Post via Script` rows). Do this as a one-off script, not a migration.

**Done when:** `GET /posts/?page=1&limit=5` returns 5 items, `total: 10`,
`total_pages: 2`, `has_next: true`, `has_previous: false`; the anonymous post in
the list has `author: null` and `slug: null`; and no `None`-dated post is at the top.

---

### Part 1 — Correctness and privacy debt. Do this before adding features.

Fix **D1, D2, D3** (all High) and **D7, D10**. These are all small edits to code
that later parts will be copied from — fix them now or the bugs propagate.

- **D1**: add `get_current_user_optional` to `_01_core/dependencies.py` (returns
  `None` instead of raising when there's no/invalid token — `HTTPBearer(auto_error=False)`).
  Then change `get_post_detail` to accept `current_user=None` and allow a
  non-published post **only** when `current_user and current_user.id == post.user_id`.
  Keep returning 404, never 403, for everyone else — a 403 confirms the post exists.
  Soft-deleted posts stay 404 for **everyone**, including the owner.
- **D2**: stop logging `user_id` for anonymous posts. Simplest correct fix: log
  `post_id` only, and log `user_id` on a separate line only when
  `not post.is_anonymous`. Remember a post can be flipped to anonymous *after*
  the creation log line was already written — so also consider whether the
  creation-time log should record `user_id` at all.
- **D3**: in `add_question_to_round`, verify the `post_round_id` row's `post_id`
  matches. Needs a repository function (`get_post_round_by_id`) — do not query
  in the service.
- **D7**: make both counter increments atomic via a SQL-side
  `UPDATE ... SET x = x + 1`.
- **D10**: rename the `attachement_url` parameter.

**Done when:** the owner can `GET` their own draft; a stranger gets 404 for the
same id; `logs/app.log` contains no `user_id` for an anonymous post; and adding a
question with another post's `post_round_id` is rejected.

---

### Part 2 — Companies resource. **Blocker.**

`POST /posts/` accepts `company_id` and `PostCreate` declares it, but **no
companies repository, service, or router exists** — so `company_id` can only ever
be `null` today. The whole "interview experiences at company X" premise is
non-functional until this exists.

Create `_04_repositories/companies.py`, `_05_services/companies.py`,
`_06_routers/companies.py`, schemas in `_03_schemas/companies.py`; register the
router in `main.py` and the names in all three `__init__.py` files.

Read spec §4 table 7 (`companies`) for the exact columns. Companies have a `slug`
— reuse `utils/slug_generator.py`.

Endpoints: `GET /companies` (**paginated** — hard rule #3), `GET /companies/{id}`,
`POST /companies` (protected). Decide and document whether any authenticated user
can create a company or only admins; `users.role` exists for this.

**Note `m27_company_statistics`** exists — do not build it in this part, but don't
design yourself into a corner.

**Done when:** a company can be created, appears in a paginated list, and a post
created with its `company_id` round-trips through `GET /posts/{post_id}`.

---

### Part 3 — Education & work history. **Blocker.**

Same situation as Part 2: `POST /posts/` accepts `education_id`, `m06_education_history`
exists and is migrated, but no layer above the model does. Also `m05_institutions`.

> ⚠️ **`education_id` must never appear in any post response.** It links a post to
> a specific college/degree row and de-anonymizes trivially. It is already in
> `LOCKED_AFTER_PUBLISH`, and neither `PostOut` nor `PostListItem` includes it.
> Keep it that way.

Endpoints: CRUD for a user's own education history, plus `GET /institutions`
(paginated) for the picker.

**Done when:** a user can add an education entry, create a post referencing it,
and confirm `education_id` appears **nowhere** in either post response.

---

### Part 4 — Feed enrichment. Depends on Part 2.

Deliberately left out of the feed to keep Part 0 reviewable:
- **`company_name` on cards.** A card showing a UUID isn't shippable. Use the
  same batched-`IN` pattern as `get_users_by_ids` — collect the page's
  `company_id`s, one query, build a dict. **Do not** loop.
- **`round_count`** — one `GROUP BY` query for the page, not one per post.
- **`experience_text` excerpt.** Decide length and where to cut. Server-side, so
  the full text never ships to a list view.

Then fix **D6** (batch `get_post_detail`'s round names and questions into two
`IN` queries) and **D8** (migration adding an index on `published_at`; consider a
composite on `(status, published_at DESC)` since the feed always filters then sorts).

**Done when:** a 20-post page is a small fixed number of queries regardless of
page size. Log SQL with `echo=True` on the engine temporarily and count.

---

### Part 5 — Public profile. Small.

Spec §9 lists this as the last ⬜ users item: view someone else's public profile
by id. `get_user_by_id` already exists in `_04_repositories/users.py` but is only
used internally.

`GET /users/{user_id}` — public. **Must not** expose `email`, `password_hash`, or
anything from `m02_user_settings`. `UserProfile` currently includes `email` —
so build a **separate, narrower** `PublicProfile` schema. Do not reuse `UserProfile`.

Consider whether it should list the user's posts (paginated, and **excluding their
anonymous ones** — a profile listing anonymous posts defeats the entire rule).

**Done when:** `GET /users/{id}` returns no email and no anonymous posts.

---

### Part 6 — Comments.

`m17_comments` exists and is migrated; `_04_repositories/comments.py`,
`_05_services/comments.py`, `_06_routers/comments.py` are 6-line stubs.

Read spec §4 table 17 for the exact columns before designing — in particular
whether it supports threading (a self-referencing `parent_comment_id`), which
changes the response shape from a flat paginated list to a tree.

Endpoints: create, list for a post (**paginated**), soft-delete own, edit own.

> ⚠️ **Comments on anonymous posts are an anonymity hazard.** If the post author
> comments on their own anonymous post, a naive "author badge" or an unfiltered
> `user_id` in the comment payload de-anonymizes them instantly. Decide the rule
> explicitly and write it down.

---

### Part 7 — Likes and bookmarks.

`m18_likes`, `m19_bookmarks`. Both are toggle tables. Build them together —
near-identical shape.

- Idempotent toggle endpoints, not blind inserts. A unique constraint on
  `(user_id, target)` plus a "does it exist" check.
- `GET /users/me/bookmarks` — paginated.
- Decide whether like counts are denormalized onto the target (like
  `easy_count`/`medium_count`/`hard_count` are on `interview_questions`) or
  counted live. Denormalized is faster but needs the same atomic-increment
  treatment as D7.

> ⚠️ Liking or bookmarking an **anonymous** post must not expose its author. If a
> like response echoes the target post, run it through the same suppression.

---

### Part 8 — Question difficulty votes.

`m12_question_difficulty_votes` exists. `easy_count`/`medium_count`/`hard_count`
are **denormalized caches on `m11_interview_questions`** (already exposed in
`QuestionOut`, currently always 0 because nothing writes them).

Per `m12`'s own docstring, the vote write **and** the cache update happen together
in the service layer. One vote per user per question — changing a vote must
decrement the old bucket and increment the new one, not just increment. Use atomic
SQL-side increments (same as D7).

**Done when:** voting twice as the same user doesn't double-count, and switching
easy→hard moves the count rather than adding to it.

---

### Part 9 — Completed-questions tracker.

`m20_completed_questions` exists. Spec §9 specifies:
- `POST /questions/{id}/complete`
- `GET /users/{id}/completed-questions?company=&category=&round_type=&page=`

Note this endpoint takes **filters**, which is otherwise Phase 2 scope — the spec
folds them in here deliberately. `round_type` no longer exists as an enum
(`m09_interview_rounds` only has `id` + nullable `name` — see D12), so decide what
`round_type=` actually filters on and document it.

`_04_repositories/questions.py` / `_05_services/questions.py` /
`_06_routers/questions.py` are all stubs — this part fills them.

---

### Part 10 — Cosmetic cleanup. Do last, in one commit.

**D11** (`class Config` → `model_config = ConfigDict(...)` in both schema files
together) and **D12** (stale docstrings in `m09`, `m11`, `main.py`, and the
`TODO:` blocks in repository/service files describing finished work).

Low value individually, but they actively mislead the next reader — `m09`'s
docstring describes a `round_type` enum that doesn't exist, which is exactly the
kind of thing an agent will faithfully implement against.

---

## 6. Explicitly out of scope for Phase 1

Do **not** build these, even if they seem adjacent:

- **Search and filters** (Phase 2) — company/college/category filters, `ILIKE`
  search. The one exception is the completed-questions endpoint in Part 9.
- **File uploads** (Phase 3) — and when you do, hard rule #1: direct-to-cloud
  only, never through the backend.
- **Frontend** (Phase 4).
- **ML categorization** (Phase 5) — `m13_question_tags`, `m14_question_tag_map`.
  Decided: ML-suggested tags are editable by the poster.
- **Deployment** (Phase 6) — Render + Supabase + Vercel.
- **Admin/moderation** (Phase 7) — `m21_reports`.
- **Follows** (`m22`), **notifications** (`m23`), **chat**
  (`m24`/`m25`/`m28_message_blocks`), **hackathons** (`m15`/`m16`),
  **contribution events** (`m26`), **company statistics** (`m27`) — all v2.
  Their stub files existing is not an invitation.

---

## 7. Git state

Branch `main`, in sync with `origin/main`. HEAD is `8ed3ef1` — the first commit
covering the entire auth + posts build (88 files, 3,248 insertions). Everything
before it was scaffolding.

Verified not tracked: `.env`, `logs/`, `venv/`, `__pycache__`. Keep it that way —
check with `git ls-files`, not just `.gitignore`.

Commit per part, not per file.
