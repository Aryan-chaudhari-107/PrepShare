"""
Repository for the posts resource — raw SQLAlchemy queries only.
"""


from sqlalchemy import case, distinct, func, or_, update
from sqlalchemy.orm import Session

from _02_models import (
    Company,
    EducationHistory,
    Institution,
    InterviewPost,
    InterviewQuestion,
    InterviewRound,
    PostRound,
)
from utils import utc_now


def create_post(db: Session, **kwargs):
    new_post = InterviewPost(**kwargs)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


def get_post_by_id(db: Session, post_id):
    return db.query(InterviewPost).filter(InterviewPost.id == post_id).first()


def add_round(db: Session, post_id, name, mode, round_number, duration_minutes=None, round_tags=None):
    new_round = InterviewRound(name=name)
    db.add(new_round)
    db.flush()

    new_post_round = PostRound(
        post_id=post_id,
        round_id=new_round.id,
        round_number=round_number,
        mode=mode,
        duration_minutes=duration_minutes,
        round_tags=round_tags,
    )
    db.add(new_post_round)
    db.commit()
    db.refresh(new_post_round)

    return new_post_round


def add_question(db: Session, post_id, post_round_id, question_text, attachment_url):
    new_question = InterviewQuestion(
        post_id = post_id, 
        post_round_id = post_round_id,
        question_text = question_text,
        attachment_url = attachment_url,
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question


def publish_post(db: Session, post, experience_text, tips, is_offer_received, job_role, package_amount, currency):
    post.experience_text = experience_text
    post.tips = tips
    post.is_offer_received = is_offer_received
    post.job_role = job_role
    post.package_amount = package_amount
    post.currency = currency
    post.status = "published"
    post.published_at = utc_now()

    db.commit()
    db.refresh(post)
    return post


def update_post(db: Session, post, updates: dict):
    for key, value in updates.items():
        setattr(post, key, value)
    db.commit()
    db.refresh(post)
    return post


def increment_share_count(db: Session, post):
    db.execute(
        update(InterviewPost)
        .where(InterviewPost.id == post.id)
        .values(share_count=InterviewPost.share_count + 1)
    )
    db.commit()
    db.refresh(post)
    return post


def get_post_rounds(db: Session, post_id):
    return (
        db.query(PostRound)
        .filter(PostRound.post_id == post_id)
        .order_by(PostRound.round_number)
        .all()
    )


def get_round_by_id(db: Session, round_id):
    return db.query(InterviewRound).filter(InterviewRound.id == round_id).first()


def get_post_round_by_id(db: Session, post_round_id):
    """Fetch a PostRound by its own id. Used to verify a round belongs to
    the expected post before attaching questions (D3 fix)."""
    return db.query(PostRound).filter(PostRound.id == post_round_id).first()


def get_questions_for_round(db: Session, post_round_id):
    return (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.post_round_id == post_round_id)
        .order_by(InterviewQuestion.created_at)
        .all()
    )


def increment_view_count(db: Session, post):
    try:
        db.execute(
            update(InterviewPost)
            .where(InterviewPost.id == post.id)
            .values(view_count=InterviewPost.view_count + 1)
        )
        db.commit()
    except Exception:
        db.rollback()
    return post


CATEGORY_KEYWORD_MAP = {
    "campus": ["campus_placement", "campus_hackathon"],
    "off-campus": ["off_campus_placement", "off_campus_hackathon"],
    "offcampus": ["off_campus_placement", "off_campus_hackathon"],
    "off": ["off_campus_placement", "off_campus_hackathon"],
    "hackathon": ["campus_hackathon", "off_campus_hackathon"],
    "placement": ["campus_placement", "off_campus_placement"],
}


def _build_field_filters(
    company_id=None,
    company_name=None,
    post_category=None,
    institution_id=None,
    institution_name=None,
    course=None,
    work_location=None,
    industry=None,
    job_role=None,
    round_tag=None,
    is_offer_received=None,
):
    clauses = []
    if company_id is not None:
        clauses.append(InterviewPost.company_id == company_id)
    if company_name:
        clauses.append(Company.name.ilike(f"%{company_name.strip()}%"))
    if post_category:
        clauses.append(InterviewPost.post_category == post_category)
    if institution_id is not None:
        clauses.append(EducationHistory.institution_id == institution_id)
    if institution_name:
        clauses.append(Institution.name.ilike(f"%{institution_name.strip()}%"))
    if course:
        clauses.append(
            or_(
                EducationHistory.course.ilike(f"%{course.strip()}%"),
                EducationHistory.branch.ilike(f"%{course.strip()}%"),
            )
        )
    if work_location:
        clauses.append(InterviewPost.work_location.ilike(f"%{work_location.strip()}%"))
    if industry:
        clauses.append(Company.industry.ilike(f"%{industry.strip()}%"))
    if job_role:
        clauses.append(InterviewPost.job_role.ilike(f"%{job_role.strip()}%"))
    if round_tag:
        clauses.append(
            or_(
                PostRound.round_tags.ilike(f"%{round_tag.strip()}%"),
                InterviewRound.name.ilike(f"%{round_tag.strip()}%"),
            )
        )
    if is_offer_received is not None:
        clauses.append(InterviewPost.is_offer_received == is_offer_received)
    return clauses


def _build_search_term_clauses(term: str):
    tp = f"%{term}%"
    clauses = [
        InterviewPost.title.ilike(tp),
        InterviewPost.job_role.ilike(tp),
        InterviewPost.work_location.ilike(tp),
        Company.name.ilike(tp),
        Company.industry.ilike(tp),
        EducationHistory.course.ilike(tp),
        EducationHistory.branch.ilike(tp),
        Institution.name.ilike(tp),
        InterviewRound.name.ilike(tp),
        PostRound.round_tags.ilike(tp),
    ]
    categories = CATEGORY_KEYWORD_MAP.get(term)
    if categories:
        clauses.append(InterviewPost.post_category.in_(categories))
    return clauses


def _build_filter_clauses(
    company_id=None,
    company_name=None,
    post_category=None,
    institution_id=None,
    institution_name=None,
    course=None,
    work_location=None,
    industry=None,
    job_role=None,
    round_tag=None,
    is_offer_received=None,
    search=None,
):
    filters = [
        InterviewPost.status == "published",
        InterviewPost.deleted_at.is_(None),
    ]

    filters.extend(
        _build_field_filters(
            company_id=company_id,
            company_name=company_name,
            post_category=post_category,
            institution_id=institution_id,
            institution_name=institution_name,
            course=course,
            work_location=work_location,
            industry=industry,
            job_role=job_role,
            round_tag=round_tag,
            is_offer_received=is_offer_received,
        )
    )

    relevance_terms = []
    if search and search.strip():
        terms = [t for t in search.strip().lower().split() if len(t) > 1]
        relevance_terms = terms
        if terms:
            term_or_list = []
            for t in terms:
                term_or_list.extend(_build_search_term_clauses(t))
            filters.append(or_(*term_or_list))

    return filters, relevance_terms


def get_published_posts(
    db: Session,
    limit: int,
    offset: int,
    company_id=None,
    company_name=None,
    post_category=None,
    institution_id=None,
    institution_name=None,
    course=None,
    work_location=None,
    industry=None,
    job_role=None,
    round_tag=None,
    is_offer_received=None,
    search=None,
):
    filters, relevance_terms = _build_filter_clauses(
        company_id=company_id,
        company_name=company_name,
        post_category=post_category,
        institution_id=institution_id,
        institution_name=institution_name,
        course=course,
        work_location=work_location,
        industry=industry,
        job_role=job_role,
        round_tag=round_tag,
        is_offer_received=is_offer_received,
        search=search,
    )

    query = (
        db.query(InterviewPost)
        .outerjoin(Company, InterviewPost.company_id == Company.id)
        .outerjoin(EducationHistory, InterviewPost.education_id == EducationHistory.id)
        .outerjoin(Institution, EducationHistory.institution_id == Institution.id)
        .outerjoin(PostRound, InterviewPost.id == PostRound.post_id)
        .outerjoin(InterviewRound, PostRound.round_id == InterviewRound.id)
        .filter(*filters)
    )

    if relevance_terms:
        score_cases = []
        for t in relevance_terms:
            tp = f"%{t}%"
            score_cases.extend([
                case((EducationHistory.course.ilike(tp), 60), else_=0),
                case((Institution.name.ilike(tp), 55), else_=0),
                case((Company.name.ilike(tp), 50), else_=0),
                case((InterviewPost.job_role.ilike(tp), 45), else_=0),
                case((PostRound.round_tags.ilike(tp), 40), else_=0),
                case((InterviewRound.name.ilike(tp), 35), else_=0),
                case((InterviewPost.work_location.ilike(tp), 30), else_=0),
                case((Company.industry.ilike(tp), 30), else_=0),
                case((InterviewPost.title.ilike(tp), 20), else_=0),
            ])
        score_expr = func.max(sum(score_cases)) if score_cases else literal(0)
        id_rows = (
            db.query(InterviewPost.id)
            .outerjoin(Company, InterviewPost.company_id == Company.id)
            .outerjoin(EducationHistory, InterviewPost.education_id == EducationHistory.id)
            .outerjoin(Institution, EducationHistory.institution_id == Institution.id)
            .outerjoin(PostRound, InterviewPost.id == PostRound.post_id)
            .outerjoin(InterviewRound, PostRound.round_id == InterviewRound.id)
            .filter(*filters)
            .group_by(InterviewPost.id, InterviewPost.published_at)
            .order_by(
                score_expr.desc(),
                InterviewPost.published_at.desc().nullslast(),
                InterviewPost.id.desc(),
            )
            .limit(limit)
            .offset(offset)
            .all()
        )
    else:
        id_rows = (
            db.query(InterviewPost.id)
            .outerjoin(Company, InterviewPost.company_id == Company.id)
            .outerjoin(EducationHistory, InterviewPost.education_id == EducationHistory.id)
            .outerjoin(Institution, EducationHistory.institution_id == Institution.id)
            .outerjoin(PostRound, InterviewPost.id == PostRound.post_id)
            .outerjoin(InterviewRound, PostRound.round_id == InterviewRound.id)
            .filter(*filters)
            .group_by(InterviewPost.id, InterviewPost.published_at)
            .order_by(
                InterviewPost.published_at.desc().nullslast(),
                InterviewPost.id.desc(),
            )
            .limit(limit)
            .offset(offset)
            .all()
        )

    p_ids = [r[0] for r in id_rows]
    if not p_ids:
        return []

    posts_map = {p.id: p for p in db.query(InterviewPost).filter(InterviewPost.id.in_(p_ids)).all()}
    return [posts_map[pid] for pid in p_ids if pid in posts_map]


def count_published_posts(
    db: Session,
    company_id=None,
    company_name=None,
    post_category=None,
    institution_id=None,
    institution_name=None,
    course=None,
    work_location=None,
    industry=None,
    job_role=None,
    round_tag=None,
    is_offer_received=None,
    search=None,
) -> int:
    filters, _ = _build_filter_clauses(
        company_id=company_id,
        company_name=company_name,
        post_category=post_category,
        institution_id=institution_id,
        institution_name=institution_name,
        course=course,
        work_location=work_location,
        industry=industry,
        job_role=job_role,
        round_tag=round_tag,
        is_offer_received=is_offer_received,
        search=search,
    )

    subq = (
        db.query(InterviewPost.id)
        .outerjoin(Company, InterviewPost.company_id == Company.id)
        .outerjoin(EducationHistory, InterviewPost.education_id == EducationHistory.id)
        .outerjoin(Institution, EducationHistory.institution_id == Institution.id)
        .outerjoin(PostRound, InterviewPost.id == PostRound.post_id)
        .outerjoin(InterviewRound, PostRound.round_id == InterviewRound.id)
        .filter(*filters)
        .group_by(InterviewPost.id)
        .subquery()
    )
    return db.query(func.count()).select_from(subq).scalar() or 0


def get_education_details_by_ids(db: Session, education_ids: list) -> dict:
    if not education_ids:
        return {}
    rows = (
        db.query(EducationHistory, Institution.name.label("institution_name"))
        .outerjoin(Institution, EducationHistory.institution_id == Institution.id)
        .filter(EducationHistory.id.in_(education_ids))
        .all()
    )
    return {
        row[0].id: {
            "institution_name": row[1],
            "course": row[0].course,
            "branch": row[0].branch,
            "degree_level": row[0].degree_level,
        }
        for row in rows
    }


def get_feed_filters_metadata(db: Session) -> dict:
    colleges = [
        r[0] for r in db.query(distinct(Institution.name))
        .filter(Institution.name.isnot(None))
        .order_by(Institution.name)
        .all()
        if r[0]
    ]
    courses = [
        r[0] for r in db.query(distinct(EducationHistory.course))
        .filter(EducationHistory.course.isnot(None))
        .order_by(EducationHistory.course)
        .all()
        if r[0]
    ]
    companies = [
        r[0] for r in db.query(distinct(Company.name))
        .filter(Company.name.isnot(None))
        .order_by(Company.name)
        .all()
        if r[0]
    ]
    locations = [
        r[0] for r in db.query(distinct(InterviewPost.work_location))
        .filter(InterviewPost.work_location.isnot(None), InterviewPost.status == "published")
        .order_by(InterviewPost.work_location)
        .all()
        if r[0]
    ]
    industries = [
        r[0] for r in db.query(distinct(Company.industry))
        .filter(Company.industry.isnot(None))
        .order_by(Company.industry)
        .all()
        if r[0]
    ]
    roles = [
        r[0] for r in db.query(distinct(InterviewPost.job_role))
        .filter(InterviewPost.job_role.isnot(None), InterviewPost.status == "published")
        .order_by(InterviewPost.job_role)
        .all()
        if r[0]
    ]
    round_tags_raw = db.query(distinct(PostRound.round_tags)).filter(PostRound.round_tags.isnot(None)).all()
    round_tags_set = set()
    for row in round_tags_raw:
        if row[0]:
            for tag in row[0].split(","):
                clean = tag.strip()
                if clean:
                    round_tags_set.add(clean)
    round_names_raw = db.query(distinct(InterviewRound.name)).filter(InterviewRound.name.isnot(None)).all()
    for row in round_names_raw:
        if row[0]:
            round_tags_set.add(row[0].strip())

    return {
        "categories": [
            {"value": "campus_placement", "label": "Campus Placement"},
            {"value": "off_campus_placement", "label": "Off-Campus Placement"},
            {"value": "campus_hackathon", "label": "Campus Hackathon"},
            {"value": "off_campus_hackathon", "label": "Off-Campus Hackathon"},
        ],
        "colleges": colleges,
        "courses": courses,
        "companies": companies,
        "locations": locations,
        "industries": industries,
        "roles": roles,
        "round_tags": sorted(list(round_tags_set)),
    }


def get_user_draft_posts(db: Session, user_id, limit: int, offset: int):
    return (
        db.query(InterviewPost)
        .filter(
            InterviewPost.user_id == user_id,
            InterviewPost.status == "draft",
            InterviewPost.deleted_at.is_(None),
        )
        .order_by(InterviewPost.created_at.desc(), InterviewPost.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_user_draft_posts(db: Session, user_id) -> int:
    return (
        db.query(func.count(InterviewPost.id))
        .filter(
            InterviewPost.user_id == user_id,
            InterviewPost.status == "draft",
            InterviewPost.deleted_at.is_(None),
        )
        .scalar()
    )


def get_published_posts_by_user(db: Session, user_id, limit: int, offset: int):
    """Fetch published, non-anonymous posts for a user's public profile."""
    return (
        db.query(InterviewPost)
        .filter(
            InterviewPost.user_id == user_id,
            InterviewPost.status == "published",
            InterviewPost.is_anonymous.is_(False),
            InterviewPost.deleted_at.is_(None),
        )
        .order_by(
            InterviewPost.published_at.desc().nullslast(),
            InterviewPost.id.desc(),
        )
        .limit(limit)
        .offset(offset)
        .all()
    )


def count_published_posts_by_user(db: Session, user_id) -> int:
    return (
        db.query(func.count(InterviewPost.id))
        .filter(
            InterviewPost.user_id == user_id,
            InterviewPost.status == "published",
            InterviewPost.is_anonymous.is_(False),
            InterviewPost.deleted_at.is_(None),
        )
        .scalar()
    )



def count_rounds_for_posts(db: Session, post_ids: list) -> dict:
    """Return {post_id: round_count} for a batch of post ids — one GROUP BY
    query for the whole page, not one query per post (feed enrichment)."""
    if not post_ids:
        return {}
    rows = (
        db.query(PostRound.post_id, func.count(PostRound.id))
        .filter(PostRound.post_id.in_(post_ids))
        .group_by(PostRound.post_id)
        .all()
    )
    return {post_id: count for post_id, count in rows}


def get_rounds_for_post_ids(db: Session, post_ids: list) -> list:
    """Batch fetch PostRound rows for multiple posts — used by get_post_detail
    D6 fix to avoid N+1 when loading a single post's rounds."""
    if not post_ids:
        return []
    return (
        db.query(PostRound)
        .filter(PostRound.post_id.in_(post_ids))
        .order_by(PostRound.round_number)
        .all()
    )


def get_round_names_for_ids(db: Session, round_ids: list) -> dict:
    """Batch fetch InterviewRound names — {round_id: name}. One IN query
    instead of one per round (D6 fix)."""
    if not round_ids:
        return {}
    rows = db.query(InterviewRound).filter(InterviewRound.id.in_(round_ids)).all()
    return {r.id: r.name for r in rows}


def get_all_questions_for_post_rounds(db: Session, post_round_ids: list) -> dict:
    """Batch fetch questions for a set of post_round_ids — {post_round_id: [questions]}.
    One IN query instead of one per round (D6 fix)."""
    if not post_round_ids:
        return {}
    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.post_round_id.in_(post_round_ids))
        .order_by(InterviewQuestion.created_at)
        .all()
    )
    result: dict = {}
    for q in questions:
        result.setdefault(q.post_round_id, []).append(q)
    return result