"""
Imports every service below. Services hold the actual business logic —
call repositories to get/save data, apply rules from MASTER_PROJECT_GUIDE.md
(conditional validation, hard rules, etc). Never touch SQLAlchemy directly.
"""


"""
Imports every service below. Services hold the actual business logic —
call repositories to get/save data, apply rules from MASTER_PROJECT_GUIDE.md
(conditional validation, hard rules, etc). Never touch SQLAlchemy directly.
"""


from _05_services import (
    bookmarks,
    comments,
    companies,
    completed_questions,
    dashboard,
    education_history,
    follows,
    institutions,
    likes,
    notifications,
    questions,
    reports,
)
from _05_services.auth import login, request_otp, verify_and_register
from _05_services.posts import (
    add_question_to_round,
    add_round_to_post,
    create_draft_post,
    get_feed_filters_metadata,
    get_post_detail,
    get_posts_feed,
    list_user_drafts,
    publish_draft_post,
    share_post,
    update_post_details,
)
from _05_services.users import (
    change_password,
    get_my_profile,
    get_public_profile,
    get_settings,
    get_user_posts,
    update_settings,
)




