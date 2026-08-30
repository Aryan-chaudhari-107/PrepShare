"""
Imports every repository below. Repositories talk to the database ONLY —
raw SQLAlchemy queries, no business rules, no HTTP knowledge.
"""

from _04_repositories.auth import (
    create_otp,
    create_user,
    get_user_by_email,
    get_user_by_username,
    get_valid_otp,
    get_valid_otp_by_user,
    increment_otp_failed_attempts,
    increment_user_token_version,
    mark_otp_used,
    update_password,
)
from _04_repositories.bookmarks import (
    count_bookmarked_posts_for_user,
    create_bookmark,
    delete_bookmark,
    get_bookmark,
    get_bookmarked_posts_for_user,
)
from _04_repositories.comments import (
    count_comments_for_post,
    create_comment,
    delete_comment,
    get_comment_by_id,
    get_comments_for_post,
    update_comment,
)
from _04_repositories.companies import (
    count_companies,
    create_company,
    get_companies_by_ids,
    get_companies_paginated,
    get_company_by_id,
    get_company_by_name,
)
from _04_repositories.completed_questions import (
    count_completed_questions_for_user,
    create_completed_question,
    delete_completed_question,
    get_completed_question,
    get_completed_questions_for_user,
)
from _04_repositories.education_history import (
    create_education,
    delete_education,
    get_education_by_id,
    get_education_for_user,
    update_education,
)
from _04_repositories.follows import (
    count_followers_for_user,
    count_following_for_user,
    create_follow,
    delete_follow,
    get_follow,
    get_followers_for_user,
    get_following_for_user,
)
from _04_repositories.institutions import (
    count_institutions,
    get_institution_by_id,
    get_institutions_paginated,
)
from _04_repositories.likes import (
    count_likes_for_post,
    create_like,
    delete_like,
    get_like,
)
from _04_repositories.notifications import (
    count_notifications_for_user,
    count_unread_notifications_for_user,
    create_notification,
    get_notification_by_id,
    get_notifications_for_user,
    mark_all_notifications_read_for_user,
    mark_notification_read,
)
from _04_repositories.posts import (
    add_question,
    add_round,
    count_published_posts,
    count_published_posts_by_user,
    count_rounds_for_posts,
    count_user_draft_posts,
    create_post,
    get_all_questions_for_post_rounds,
    get_education_details_by_ids,
    get_feed_filters_metadata,
    get_post_by_id,
    get_post_round_by_id,
    get_post_rounds,
    get_published_posts,
    get_published_posts_by_user,
    get_questions_for_round,
    get_round_by_id,
    get_round_names_for_ids,
    get_rounds_for_post_ids,
    get_user_draft_posts,
    increment_share_count,
    increment_view_count,
    publish_post,
    update_post,
)
from _04_repositories.questions import (
    adjust_question_difficulty_counts,
    create_difficulty_vote,
    delete_difficulty_vote,
    get_difficulty_vote,
    get_question_by_id,
    update_difficulty_vote,
)
from _04_repositories.reports import (
    create_report,
    get_report_by_id,
)
from _04_repositories.users import (
    get_or_create_user_settings,
    get_user_by_id,
    get_users_by_ids,
    update_user_settings,
)
