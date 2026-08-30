"""Router for 'posts' endpoints."""



import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_current_user_optional, get_db
from _01_core.rate_limiter import limiter
from _02_models import User
from _03_schemas import (
    PostCreate,
    PostListResponse,
    PostOut,
    PostPublish,
    PostUpdate,
    QuestionCreate,
    RoundCreate,
)
from _05_services import posts

router = APIRouter(prefix="/posts", tags=["posts"])
@router.post("/")
def create_post(
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return posts.create_draft_post(db, current_user, data)


@router.post("/{post_id}/rounds")
def add_round(
    post_id: uuid.UUID,
    data: RoundCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return posts.add_round_to_post(db, current_user, post_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    

@router.post("/{post_id}/rounds/{post_round_id}/questions")
def add_question(
    post_id: uuid.UUID,
    post_round_id: uuid.UUID,
    data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return posts.add_question_to_round(db, current_user, post_id, post_round_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/{post_id}/publish")
def publish_post(
    post_id : uuid.UUID,
    data: PostPublish, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return posts.publish_draft_post(db, current_user, post_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{post_id}")
def update_post(
    post_id: uuid.UUID,
    data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return posts.update_post_details(db, current_user, post_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))



@router.post("/{post_id}/share")
@limiter.limit("20/minute")
def share_post(
    request: Request,
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    try:
        return posts.share_post(db, post_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/filters-metadata")
def get_filters_metadata(db: Session = Depends(get_db)):
    return posts.get_feed_filters_metadata(db)


@router.get("/", response_model=PostListResponse)
def list_posts(
    company_id: uuid.UUID | None = Query(None),
    company_name: str | None = Query(None),
    post_category: str | None = Query(None),
    category: str | None = Query(None),
    institution_id: uuid.UUID | None = Query(None),
    institution_name: str | None = Query(None),
    course: str | None = Query(None),
    work_location: str | None = Query(None),
    location: str | None = Query(None),
    industry: str | None = Query(None),
    job_role: str | None = Query(None),
    role: str | None = Query(None),
    round_tag: str | None = Query(None),
    is_offer_received: bool | None = Query(None),
    offer_status: str | None = Query(None),
    search: str | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    cat = post_category or category
    loc = work_location or location
    r = job_role or role
    s = search or q
    offer = is_offer_received
    if offer_status == "offer_received":
        offer = True
    elif offer_status == "no_offer":
        offer = False

    return posts.get_posts_feed(
        db,
        page=page,
        limit=limit,
        company_id=company_id,
        company_name=company_name,
        post_category=cat,
        institution_id=institution_id,
        institution_name=institution_name,
        course=course,
        work_location=loc,
        industry=industry,
        job_role=r,
        round_tag=round_tag,
        is_offer_received=offer,
        search=s,
    )


@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    try:
        return posts.get_post_detail(db, post_id, current_user=current_user, background_tasks=background_tasks)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))