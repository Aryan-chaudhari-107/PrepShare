"""
TODO 21:

Table: COMMENTS

id                  UUID, primary key, auto-generated
post_id             FK -> interview_posts.id, ON DELETE CASCADE
user_id             FK -> users.id, ON DELETE CASCADE
comment_text        text
parent_comment_id   FK -> comments.id, nullable — null = top-level comment,
                    set = this is a reply to another comment (self-referencing FK)
created_at          timestamp, indexed
updated_at          timestamp
"""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_posts.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    comment_text = Column(Text, nullable=False)

    # self-referencing FK: points to another row in this SAME table.
    # null = top-level comment, set = a reply to that comment.
    parent_comment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
    )

    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        Index("ix_comments_post_id_created_at", "post_id", "created_at"),
    )