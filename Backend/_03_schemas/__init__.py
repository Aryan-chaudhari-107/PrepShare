"""Imports every schema below, mirroring _02_models/__init__.py pattern."""


from _03_schemas.auth import (
    RequestOTP,
    ResetPassword,
    Token,
    UserLogin,
    VerifyAndRegister,
)
from _03_schemas.bookmarks import BookmarkStatusResponse, BookmarkToggleResponse
from _03_schemas.comments import (
    CommentCreate,
    CommentListResponse,
    CommentOut,
    CommentUpdate,
)
from _03_schemas.companies import CompanyCreate, CompanyListResponse, CompanyOut
from _03_schemas.completed_questions import (
    CompletedQuestionItem,
    CompletedQuestionListResponse,
    CompletedToggleResponse,
)
from _03_schemas.education_history import EducationCreate, EducationOut, EducationUpdate
from _03_schemas.follows import FollowListResponse, FollowToggleResponse, FollowUserItem
from _03_schemas.institutions import InstitutionListResponse, InstitutionOut
from _03_schemas.likes import LikeStatusResponse, LikeToggleResponse
from _03_schemas.notifications import (
    NotificationListResponse,
    NotificationOut,
    NotificationSender,
)
from _03_schemas.posts import (
    AuthorOut,
    PostCreate,
    PostListItem,
    PostListResponse,
    PostOut,
    PostPublish,
    PostUpdate,
    QuestionCreate,
    QuestionOut,
    RoundCreate,
    RoundOut,
)
from _03_schemas.questions import DifficultyVoteCreate, DifficultyVoteResponse
from _03_schemas.reports import ReportCreate, ReportOut
from _03_schemas.user_settings import UserSettingsOut, UserSettingsUpdate
from _03_schemas.users import ChangePassword, PublicProfile, UserProfile
