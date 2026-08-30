"""
Imports EVERY model in this package.

Why this file matters: Alembic's `--autogenerate` only detects a table if its
model class has been imported somewhere Python actually runs. If you add
m28_something.py and forget to add the import line below, Alembic will
silently produce an empty migration — no error, the table just won't exist
in the database.

RULE: every time a new file is added to _02_models/, add its import line here
in the SAME sitting you create the file. Not "later."
"""

from _02_models.m01_users import User
from _02_models.m02_user_settings import UserSettings
from _02_models.m03_otps import Otp
from _02_models.m04_login_sessions import LoginSession
from _02_models.m05_institutions import Institution
from _02_models.m06_education_history import EducationHistory
from _02_models.m07_companies import Company
from _02_models.m08_interview_posts import InterviewPost
from _02_models.m09_interview_rounds import InterviewRound
from _02_models.m10_post_rounds import PostRound
from _02_models.m11_interview_questions import InterviewQuestion
from _02_models.m12_question_difficulty_votes import QuestionDifficultyVote
from _02_models.m13_question_tags import QuestionTag
from _02_models.m14_question_tag_map import QuestionTagMap
from _02_models.m15_hackathons import Hackathon
from _02_models.m16_hackathon_phases import HackathonPhase
from _02_models.m17_comments import Comment
from _02_models.m18_likes import Like
from _02_models.m19_bookmarks import Bookmark
from _02_models.m20_completed_questions import CompletedQuestion
from _02_models.m21_reports import Report
from _02_models.m22_follows import Follow
from _02_models.m23_notifications import Notification
from _02_models.m24_conversations import Conversation
from _02_models.m25_messages import Message
from _02_models.m26_contribution_events import ContributionEvent
from _02_models.m27_company_statistics import CompanyStatistics
from _02_models.m28_message_blocks import MessageBlock

__all__ = [
    "Bookmark",
    "Comment",
    "Company",
    "CompanyStatistics",
    "CompletedQuestion",
    "ContributionEvent",
    "Conversation",
    "EducationHistory",
    "Follow",
    "Hackathon",
    "HackathonPhase",
    "Institution",
    "InterviewPost",
    "InterviewQuestion",
    "InterviewRound",
    "Like",
    "LoginSession",
    "Message",
    "MessageBlock",
    "Notification",
    "Otp",
    "PostRound",
    "QuestionDifficultyVote",
    "QuestionTag",
    "QuestionTagMap",
    "Report",
    "User",
    "UserSettings",
]
