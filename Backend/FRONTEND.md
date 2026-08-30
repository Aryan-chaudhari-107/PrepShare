# FRONTEND.md — PrepShare Platform

Written 2026-08-26. Companion to [HANDOFF.md](HANDOFF.md) (backend state) and
`MASTER_PROJECT_GUIDE.md` (authoritative spec).

Everything in §3–§7 below is **the owner's stated requirement**, extracted from the
guide's §2 (stack), §5 (post-creation UX), §6 (wireframe notes), §7 (open decisions),
and §9 Phase 4. Where the guide is silent, this document says so explicitly rather
than inventing an answer — see §10.

---

## 1. Read this first — two hard blockers

### 1.1 There is no CORS middleware. Nothing in a browser can call this API.

`main.py` has no `CORSMiddleware`. Every `fetch`/Axios call from `localhost:5173`
(or any origin) will fail the preflight check before it reaches a route. This is the
single first thing to fix, and it is a **backend** change:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # add the deployed origin later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Do **not** ship `allow_origins=["*"]` together with `allow_credentials=True` —
browsers reject that combination, and it's a real security hole regardless. List
origins explicitly and drive them from an env var.

### 1.2 Resumable drafts — a required feature — is currently impossible.

The guide (§5) states plainly: *"If they close the app mid-way without finishing, the
draft **persists and is resumable** later."*

Two backend gaps make this unbuildable today:

- **Defect D1**: `GET /posts/{post_id}` returns 404 for anything not `published`,
  including to the post's own author. So a draft cannot be read back at all.
- **There is no drafts list endpoint.** Even once D1 is fixed, nothing returns
  "my unfinished posts", so the UI has no way to *find* the draft to resume. The
  feed (`GET /posts`) is published-only by design.

Both are backend work (HANDOFF Part 1). Until they land, the multi-step post form
can only be built as a single unbroken session — which contradicts the spec. Don't
paper over it with `localStorage`; that loses the server-side draft the backend is
already correctly creating.

---

## 2. Stack (locked in — guide §2)

| | |
|---|---|
| Framework | **React** |
| Styling | **Tailwind** |
| HTTP | **Axios** |
| Forms | **react-hook-form**, with `useFieldArray` for repeatable fields |
| Charts | **Recharts** — v1.5/v2 analytics pages only, not needed for v1 |
| Hosting | **Vercel or Netlify — not yet decided** |

The guide says: *"don't suggest swapping tools without a strong reason."* Treat these
as fixed. Note there is **no state-management or routing library named** — see §10.

### Axios setup notes specific to this API

- **Auth header is `Authorization: Bearer <token>`.** The backend uses FastAPI's
  `HTTPBearer`, not `OAuth2PasswordBearer` — so login is a plain JSON body, **not**
  form-encoded `username`/`password`. Set up one Axios instance with a request
  interceptor that attaches the token.
- **Trailing slashes matter.** `POST /posts/` and `GET /posts/` are registered with a
  trailing slash. Calling `/posts` gets a `307` redirect, and some clients drop the
  `Authorization` header across a redirect. Always call `/posts/`.
- **There is no refresh-token endpoint.** A 401 means re-login, full stop. Add a
  response interceptor: on 401, clear the token and route to login.
  `ACCESS_TOKEN_EXPIRE_MINUTES` is temporarily `1440` (24h) for dev convenience and
  **will be dropped to 60** before deploy — so build the 401 path properly now, or it
  will look fine in dev and break the day that value changes.

---

## 3. Screens

Phase 4 scope per guide §9: *"Auth pages, paginated dashboard feed, multi-step post
form, profile page with tabs (Profile / Add Question / Completed Questions /
Settings), post detail page, search/filter UI."*

### 3.1 Auth

**There is no single signup endpoint.** Registration is deliberately two steps, so
it's two screens (or one screen, two states):

1. **Enter email** → `POST /auth/request-otp` body `{email}`. A real OTP email is
   sent. **No account exists yet at this point.** A `409` means the email is already
   registered.
2. **Enter OTP + profile** → `POST /auth/verify-and-register` body
   `{email, otp_code, username, password, full_name?}`. This is the moment the
   account is created; it returns the access token directly, so log the user straight
   in. A `400` means the OTP is wrong, used, or expired.

If you find references to `UserSignup` or `/auth/signup` anywhere, they're stale.

**Login** — `POST /auth/login` body `{identifier, password}`. One field, labelled
something like "Email or username": the backend decides which lookup to run by
checking for an `@`. Don't build two separate fields or a toggle. `401` = bad
credentials, `403` = email not verified.

**Forgot password** — `POST /auth/forgot-password` body `{email}`, then
`POST /auth/reset-password` body `{email, otp_code, new_password}`.

> ⚠️ Forgot-password **always returns the same generic message** — *"If that email is
> registered, an OTP has been sent"* — whether or not the email exists. This is
> deliberate anti-enumeration design. **Do not** "improve" the UX by showing "no
> account found". Display the generic message verbatim and always advance to the
> OTP screen.

**Rate limits are real and the UI must handle `429`:** request-otp 3/min, login
5/min, forgot-password 3/min, all keyed by IP. Show a friendly cooldown, disable the
submit button, and don't let a retry loop hammer it.

### 3.2 Dashboard feed

`GET /posts/?page=1&limit=10` → paginated envelope:

```json
{ "items": [...], "page": 1, "limit": 10, "total": 10,
  "total_pages": 1, "has_next": false, "has_previous": false }
```

- `page` is **1-based**. `limit` is capped at **50** server-side.
- A page past the end returns `items: []` with `200`, **not** a 404. Render an empty
  state, don't treat it as an error.
- Use `has_next`/`has_previous` for controls, `total_pages` for page numbers.
- Sorted newest-published first.

Each `items[]` entry (`PostListItem`) carries: `id`, `title`, `slug`,
`post_category`, `company_id`, `is_anonymous`, `author`, `is_offer_received`,
`job_role`, `package_amount`, `currency`, `view_count`, `share_count`,
`published_at`, `created_at`.

**Known gaps for card design, all backend work:**

- **`company_id` is a UUID, not a name.** A card can't show "Google" yet.
  HANDOFF Part 4.
- **No `experience_text` excerpt.** If cards want a snippet, it must come from the
  server — the full write-up is deliberately not in the list payload.
- **No `round_count`.** Can't show "5 rounds" yet.
- **No like/comment/bookmark counts.** Those features don't exist yet (Parts 6, 7).

The list payload deliberately **omits** `age`, `year_of_study`, `experience_years`,
and `work_location` even though the detail view has them — a paginated endpoint
would otherwise let someone enumerate every anonymous poster's demographic
fingerprint in a few requests. Don't add them back to the card.

### 3.3 Post detail

`GET /posts/{post_id}` — public, no auth needed. Returns the full post with
`rounds[]`, each round holding its own `questions[]`. One post renders as the whole
journey: Round 1 → Round 2 → Round 3, each round showing its own `mode`
(online/offline) and its own questions.

Response shape (`PostOut`) adds, over the list item: `education_id`-free demographic
fields (`year_of_study`, `age`, `experience_years`, `current_status`,
`work_location`, `work_mode`), `experience_text`, `tips`, `status`, and `rounds[]`.

Each round: `{post_round_id, round_number, name, mode, questions[]}`. `name` is
optional and may be `null` — the poster can leave a round unlabelled, so render
"Round 3" rather than an empty heading.

Each question: `{id, question_text, attachment_url, is_verified, easy_count,
medium_count, hard_count}`. **Both `question_text` and `attachment_url` are
nullable, but at least one is always present** — render either, or both. There is no
"aptitude is file-only" special case; that was removed.

`increment_view_count` fires on every GET, so the `view_count` you receive includes
the current view. Don't call it twice on mount (watch React strict-mode double-invoke
in dev).

### 3.4 Multi-step post creation — guide §5

**Category first, and that one choice drives every field after it.** Four options:
`campus_hackathon`, `off_campus_hackathon`, `campus_placement`,
`off_campus_placement`. There is deliberately no standalone "aptitude" category — an
aptitude-only experience is just an interview post with one round.

**Then campus vs off-campus:**

- **Campus** → qualification selector shown. College and course are **derived
  automatically** through `education_id → education_history → institutions`. This is
  explicit in the spec: **never a free-typed college field.**
- **Off-campus** → no college field at all.

**Interview post, campus:** college/course (auto-filled) → `year_of_study` → `age`
(optional) → company (**select or add new**) → `work_location` → `work_mode`
(Remote/Onsite/Hybrid) → **offer received? (yes/no toggle)** → if yes: `job_role`,
`package_amount`, `currency`; if no: straight to rounds.

**Interview post, off-campus:** company → degree (optional `education_history` link)
→ `age` → `experience_years` → `current_status` (Student/Fresher/Working
Professional) → `work_location` → `work_mode` → **offer received? toggle** → if yes:
the same three fields; if no: straight to rounds.

**Rounds — repeatable, numbered, saved incrementally.** This is the important part
and it maps directly onto the existing API:

1. As soon as step 1 is filled → `POST /posts/` creates the post as `status: draft`
   immediately. Body is `PostCreate`: `{post_category, title, company_id?,
   education_id?, year_of_study?, experience_years?, current_status?, age?,
   work_location?, work_mode?, is_anonymous?}`. Response gives you `post_id` — hold
   it for every subsequent call.
2. Per round → `POST /posts/{post_id}/rounds` body `{name?, mode}`. `mode` is
   `"online"` or `"offline"`, **independent per round** (one round can be in person
   while another was a video call). `round_number` is assigned server-side. Response
   gives `post_round_id`.
3. Per question in that round →
   `POST /posts/{post_id}/rounds/{post_round_id}/questions` body
   `{question_text?, attachment_url?}` — **at least one required**, both allowed.
4. Ask **"Add another round?"** — Yes loops back to step 2, No finalizes.
5. Finalize → `PUT /posts/{post_id}/publish` body `{experience_text, tips?,
   is_offer_received, job_role?, package_amount?, currency?}`. Flips `status` to
   `published` and sets `published_at`. If `is_offer_received` is true, all three
   offer fields are **required** — the server rejects with `400` otherwise, so
   validate client-side too.

**No fixed round-type dropdown.** The poster types a free label if they want
("Aptitude Test", "Viva", "Case Study", "Practical Exam") or leaves it blank. This
is deliberate — it keeps the platform usable outside tech placements. Don't add a
preset list.

**No fixed round order.** Rounds can be added in whatever order the poster likes;
`round_number` just records the order they were actually added in.

**Difficulty is never set by the poster** — it's crowd-voted by readers afterward.
Don't put a difficulty field in the creation form.

**Topic tags are not typed by the poster either** — ML reads the question content
(Phase 5). Not in the v1 form.

**Repeatable question boxes** use `react-hook-form`'s `useFieldArray` (§6). The
poster never types or picks an ID for anything — `post_rounds.id` and
`interview_questions.id` are server-generated UUIDs. Read the ids out of each
response and keep them in form state.

**Caps to enforce client-side:** 15 rounds per post maximum (hard rule #6 — the
server rejects the 16th with a `400`). Disable "Add round" at 15.

**Rounds can only be added while `status=draft`.** After publish, `POST .../rounds`
returns `400 "Cannot add rounds to a published post"`. The edit form must not offer
round-adding on a published post.

> ⚠️ **Hackathon posts cannot be built yet.** Guide §5 fully specifies hackathon
> fields (name/theme, level College/State/National, eligibility, team_size, venue,
> problem statement, repeatable **phases** with `phase_type` and per-phase mode,
> rank, prize, evaluation questions, tips). The models exist (`m15_hackathons`,
> `m16_hackathon_phases`) but **no repository, service, or router does** — and
> `PostCreate` has no hackathon fields at all. Two of the four categories are
> therefore dead ends. Either hide the hackathon categories in v1, or get the
> backend built first. This is not in HANDOFF's part list — it needs adding.

### 3.5 Post editing

Rules the UI must reflect (guide §5):

- **Draft** → freely editable, no limits, show the full form.
- **Published** → editable only within **3 days** of `published_at` **and** only
  **3 times** total. After either limit, permanently locked.
- **Locked forever, even inside the window:** `post_category`, `company_id`,
  `education_id`, and `slug`. Render these read-only on a published post — the
  server returns `400` naming the field.
- **Freely editable inside the window:** `title`, `year_of_study`, `age`,
  `experience_years`, `current_status`, `work_location`, `work_mode`,
  `experience_text`, `tips`, `job_role`, `package_amount`, `currency`,
  `is_offer_received`.
- **Always free, no limit, no window: flipping `is_anonymous` to true.** Surface this
  as a separate always-available "Make this anonymous" action, *not* buried in the
  edit form behind the edit-limit gate. Privacy must never be blocked by having used
  up edits on typos. Send it as a lone-field PATCH — the exemption is implemented as
  *"the update contains only `is_anonymous`"*, so bundling it with a title change
  consumes an edit.

`PATCH /posts/{post_id}` — send **only changed fields**. The backend uses
`exclude_unset=True`, so an unsent field is untouched, but an explicitly-sent `null`
will wipe it.

> ⚠️ **The guide names a backend gap here and it's still open.** §5: *"**Frontend
> responsibility (not yet built):** before showing the edit form, display remaining
> edits / days left (or 'this post can no longer be edited') — needs
> `edits_remaining` / `days_left_to_edit` as computed fields once
> `GET /posts/{post_id}` is built."*
>
> `GET /posts/{post_id}` is now built and **does not include either field**. It also
> doesn't expose `edit_count`. So the UI currently cannot tell the user how many
> edits they have left without re-deriving it from `published_at` — and it can't
> derive the count at all. **Add `edits_remaining` and `days_left_to_edit` to
> `PostOut`** as computed fields in the service. Small change, explicitly required,
> currently missing.

### 3.6 Comment section — split view, not a modal (guide §6)

Verbatim from the wireframe notes:

- Opening the comment section triggers a **layout change, not a modal/overlay**.
- The **left panel (comments) expands larger**; a **right panel shows the post's
  questions/rounds content**.
- Both panels scroll **independently**. Comments on the left don't scroll with the
  questions on the right, and vice versa.

So this is a two-pane layout with two separate scroll containers — not a drawer, not
a dialog. Plan the post-detail route to support both a single-column and a
split state.

**Comments don't exist in the backend yet** (HANDOFF Part 6), so this is
design-and-scaffold-only for now.

### 3.7 Difficulty voting (guide §6)

Per **individual question**, not per post. A post with 12 questions across several
rounds gets 12 independent widgets.

- Three small buttons below each question: **Easy / Medium / Hard**, with that
  question's current count under each (`easy_count`, `medium_count`, `hard_count` —
  already in the `QuestionOut` payload today, currently always `0` because nothing
  writes them).
- **Single-select per user per question** — enforced by `UNIQUE(question_id, user_id)`.
- **Tapping your current selection un-votes it** — removes the vote entirely and
  decrements that count.
- **Tapping a different difficulty moves the vote** — decrement the old bucket,
  increment the new one. Never stack two votes.

Optimistic UI is fine here, but reconcile against the server response — the counts
are denormalized caches and the vote endpoint is the source of truth.

**No voting endpoint exists yet** (HANDOFF Part 8). The counts render today; the
buttons have nothing to call.

### 3.8 Floating nav (guide §6)

Four floating icons, **top-right**: **Profile** (view/edit), **Post** (create new),
**Settings**, **Chat**.

- Exact vertical order/placement is **explicitly deferred** — the guide says not yet
  decided. Pick something and note it as provisional.
- **Chat is v2.** Render it disabled/coming-soon, or omit it. `m24_conversations`,
  `m25_messages`, `m28_message_blocks` exist as models with nothing above them.

### 3.9 Profile page — tabs (guide §7, marked "rough shape", not final)

1. **Profile** — bio, education/work history, contribution score.
2. **Add Question / My Posts.**
3. **Completed Questions** — with company / category / round filters.
4. **Settings** — theme toggle, account.

The guide flags this breakdown as *"Exact breakdown to be finalized"*. Treat the tab
set as provisional.

Backing endpoints available today: `GET /users/me` only (returns `id`, `email`,
`username`, `full_name`, `bio`, `profile_photo_url`, `role`, `contribution_score`,
`is_email_verified`). Everything else on this page is blocked — see §8.

**Someone else's profile** needs `GET /users/{user_id}`, which doesn't exist
(HANDOFF Part 5). When it does, it must be a **narrower** payload than
`GET /users/me` — `UserProfile` includes `email`, which must never appear on a public
profile.

### 3.10 Settings

Guide §7 names a **theme toggle** and account settings. `m02_user_settings` exists as
a model with no endpoint above it, so theme preference can't persist server-side yet.
Client-only (`localStorage`) is a reasonable v1 stopgap — just know it won't follow
the user across devices.

A theme toggle means **dark mode is a v1 requirement.** Configure Tailwind's `dark:`
variant and pick your token strategy at the start; retrofitting is painful.

### 3.11 Search / filter UI

Phase 4 lists it; the backend calls it **Phase 2** and it is **not built**. Query-param
filters (company, college, category, round type) plus basic `ILIKE` search. `GET /posts`
today accepts only `page` and `limit`. Design the feed so filters can slot in later,
but don't build the UI against endpoints that don't exist.

Note `round_type` **no longer exists** as a concept — `m09_interview_rounds` has only
`id` and a nullable free-text `name`. Any "filter by round type" UI needs that
redefined first.

---

## 4. The anonymity contract — the frontend's obligations

Guide §7, DECIDED, zero exceptions: *"anonymous posts have ZERO identity surface."*

The backend enforces this on the wire. The frontend can still break it:

- **`author` is `null` on an anonymous post.** Not a blank string, not a partial
  object — `null`. Render a neutral "Anonymous" byline with **no avatar, no link, no
  profile hover card**. Never fall back to another field to fill the gap.
- **`slug` is also `null` on an anonymous post.** Deliberate: the slug is generated
  once from the original title and never regenerated, so it can still contain a real
  name the poster has since edited out. **Route by `id`, not `slug`.** If you build
  slug-based URLs, anonymous posts silently 404 or leak.
- **No "message the poster" affordance on an anonymous post, ever.** Explicitly
  decided: *"No 'message the poster' feature exists for anonymous posts, period."*
  Because profiles are always public, one revealed username destroys anonymity
  entirely. When chat ships, hide the DM button whenever `is_anonymous` is true.
- **When comments ship: no author badge on the OP's own comments on their own
  anonymous post.** The guide names this case specifically — *"not comments made by
  the OP on their own post"*. A "Author" chip would de-anonymize instantly.
- **Never send `is_anonymous: false`** as part of an unrelated PATCH. Un-anonymizing
  is not a supported action and shouldn't be reachable from the UI.

---

## 5. Error handling contract

| Status | Where | Meaning / UI |
|---|---|---|
| `400` | most posts routes, register, reset-password | Business-rule rejection. `detail` is a human-readable sentence — safe to display. |
| `401` | login, any protected route | Bad credentials, or expired/missing token. On a protected route: clear token, route to login. |
| `403` | login | Email not verified. |
| `404` | `GET /posts/{id}` | Post missing, unpublished, flagged, or soft-deleted — **deliberately indistinguishable.** Show one generic "not found". |
| `409` | request-otp | Email already registered. |
| `422` | anywhere | Pydantic validation. Nested `detail[]` array, not a string — needs different handling from `400`. |
| `429` | request-otp, login, forgot-password | Rate limited. Cooldown UI, disable submit. |

FastAPI errors are `{"detail": ...}`. For `400`/`401`/`403`/`404`/`409` that's a
string; for `422` it's an array of objects. Write one normalizer in the Axios
response interceptor rather than handling both shapes at every call site.

---

## 6. Data-shape gotchas

- **Datetimes have no timezone marker.** `published_at` comes back as
  `"2026-08-26T14:38:34.997263"` — no `Z`, no offset — because Postgres `DateTime`
  columns are naive here even though the values are UTC. `new Date(thatString)` will
  parse it as **local time** and be wrong by your offset. Append `Z` before parsing,
  or parse explicitly as UTC.
- **`published_at` can be `null` on a published post.** Legacy rows predating the
  column (defect D5). Guard your date formatting.
- **`package_amount` is a number, not a formatted string** — `650000.0`, no currency
  symbol. `currency` is a separate free-text field (`"INR"`). Format client-side, and
  handle either being `null` when `is_offer_received` is false.
- **UUIDs everywhere, no integer ids.** Never construct or guess one.
- **`view_count` increments on every detail GET.** React strict mode double-invokes
  effects in dev, so you'll see it jump by 2 locally. Not a backend bug.

---

## 7. File uploads — hard rule #1

*"Never route file uploads through the backend — direct-to-cloud (S3/Cloudinary)
only, backend only stores the resulting URL."*

So `attachment_url` and `profile_photo_url` are set by the **frontend** uploading
directly to S3/Cloudinary and then sending the resulting URL to the API. There is no
multipart upload endpoint and there must never be one.

This is Phase 3 and **nothing exists yet** — no signed-URL endpoint, no storage
account decided (S3 *or* Cloudinary, undecided). Until then, question attachments
can only be built as a URL text input.

---

## 8. What's blocked, and what unblocks it

| Screen / feature | Blocked on | HANDOFF part |
|---|---|---|
| **Any browser request at all** | CORS middleware | §1.1 above — do first |
| Dashboard feed | `GET /posts` route not registered | Part 0 |
| Resumable draft / multi-step form | D1 + no drafts-list endpoint | Part 1 |
| Company selector ("select or add new") | No companies endpoints exist | Part 2 |
| Company names on cards | Only `company_id` returned | Part 4 |
| Campus flow (college/course auto-derived) | No education/institutions endpoints | Part 3 |
| Edit form ("2 edits left, 1 day remaining") | `edits_remaining` / `days_left_to_edit` missing from `PostOut` | §3.5 above |
| Someone else's profile | `GET /users/{id}` doesn't exist | Part 5 |
| Comment split-view | Comments not built | Part 6 |
| Like / bookmark buttons | Not built | Part 7 |
| Difficulty voting buttons | No vote endpoint | Part 8 |
| Completed Questions tab | Not built | Part 9 |
| Hackathon post creation | No hackathon layer, no schema fields | **not yet in HANDOFF** |
| Search / filters | Phase 2 | — |
| File attachments | Phase 3, storage undecided | — |
| Chat | v2 | — |

**What can actually be built today:** auth (all five flows), the post-detail read
view, and the create-post form for the two *placement* categories in one unbroken
session with no company and no college. That's it. Fix CORS and HANDOFF Parts 0–3
first, or the frontend will be built against mocks.

---

## 9. Suggested build order

1. **CORS** (backend, 5 min) — nothing works without it.
2. Axios instance, token storage, 401 interceptor, error normalizer.
3. Auth screens — fully buildable today, and they unblock everything protected.
4. Tailwind theme tokens + dark mode wiring — cheap now, painful later.
5. Post detail — the richest read-only payload that already works end to end.
6. Dashboard feed — **after** HANDOFF Part 0 registers the route.
7. Multi-step create form — **after** Parts 1–3, or you'll build it twice.
8. Profile + Settings tabs, as endpoints land.

---

## 10. Not specified — decide before building

The guide is genuinely silent on these. Flagged rather than invented:

- **Routing library.** No mention of React Router or anything else. Needed for
  post-detail URLs and profile tabs.
- **Server-state / data-fetching library.** Axios is specified, but nothing about
  caching, pagination state, or refetching. Bare Axios plus `useEffect` will hurt on
  the feed; TanStack Query is the obvious fit but is an addition to the locked stack
  — get the owner's call.
- **Client state.** No mention of Context, Zustand, Redux. Auth token + current user
  need to live somewhere.
- **Build tool.** Vite vs Create React App vs Next.js. Note the guide says "React",
  not "Next.js", and lists Vercel/Netlify as generic static hosts — so a SPA is the
  likely intent, but it isn't stated.
- **TypeScript or JavaScript.** Never mentioned. Given the number of nullable API
  fields (`author`, `slug`, `question_text`, `published_at`, every offer field), TS
  would catch a real class of bug here — worth raising.
- **Any visual design direction at all.** No colors, typography, spacing, logo,
  brand, or reference screenshots exist anywhere in the guide. The wireframes are
  referenced in §6 but not included in the repo. **Get the wireframes** — §6 is
  explicitly derived from them and they'll answer layout questions this document
  can't.
- **Mobile / responsive expectations.** Never stated. The split-panel comment view
  (§3.6) has no obvious mobile equivalent — it needs a defined collapse behaviour.
- **Empty, loading, and error states.** Not specified for any screen.
- **Frontend repo location.** Separate repo, or a folder in this one? Nothing says.

---

## 11. Out of scope for v1

Don't build these even though models or stub files exist: chat/DMs, notifications,
follows, duplicate-question detection, hackathon analytics, company/college insight
pages, leaderboards, share-card generator, upvote/downvote beyond likes, verified
badges, moderator roles, practice mode. All v2 or later per guide §11.

Recharts is in the locked stack but is for **v1.5/v2 analytics pages** — not needed
for v1.
