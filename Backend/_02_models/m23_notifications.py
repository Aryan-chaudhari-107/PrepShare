"""
TODO 27:

Table: NOTIFICATIONS

id                  UUID, primary key, auto-generated
receiver_id         FK -> users.id, ON DELETE CASCADE, indexed
sender_id           FK -> users.id, nullable
type                enum: LIKE / COMMENT / FOLLOW / NEW_POST
reference_id        UUID — the id of whatever this notification is about
reference_type      enum: post / comment / user — tells you which table reference_id points to
is_read             boolean, default false
created_at          timestamp
"""

import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    receiver_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    type = Column(
        Enum("LIKE", "COMMENT", "FOLLOW", "NEW_POST", name="notification_type"),
        nullable=False,
    )

    # NOT a ForeignKey — this UUID can point at a post, a comment, or a user,
    # depending on reference_type below. A real FK can only point at one
    # fixed table, so this is deliberately left as a plain UUID column.
    reference_id = Column(UUID(as_uuid=True), nullable=False)

    reference_type = Column(
        Enum("post", "comment", "user", name="reference_type"),
        nullable=False,
    )

    is_read = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=utc_now, nullable=False)

"""
The problem this solves: a notification can be about very different kinds of things:

"Someone liked your post" → the notification is about a interview_posts row
"Someone commented on your post" → the notification is about a comments row
"Someone followed you" → the notification is about a users row (the person who followed)

Normally, a foreign key can only point at one specific table — that's the whole idea of ForeignKey("interview_posts.id"): it's hardwired to always mean "look in the interview_posts table." But here, the same notifications table needs to sometimes point at interview_posts, sometimes at comments, sometimes at users — one column can't be ForeignKey to three different tables at once.

So instead, two columns work together:

reference_type — a label saying which table to look in: "post", "comment", or "user"
reference_id — the actual UUID of the row in that table

Example, three real notification rows:

receiver_id	type	reference_type	reference_id
Priya's id	LIKE	post	(the id of the post that got liked)
Priya's id	COMMENT	comment	(the id of the comment that was posted)
Priya's id	FOLLOW	user	(the id of the person who followed her)

When your app displays this notification to Priya, it reads reference_type first ("oh, this one says post"), and then knows to go look up that id inside the interview_posts table specifically — not comments, not users.

The tradeoff: because reference_id isn't a real ForeignKey, Postgres itself can't verify the id you put there actually exists in the right table — that responsibility falls entirely on your application code (the router/endpoint that creates notifications) to get right. It's less "safe" than a normal FK, but it's the standard way to solve "this column needs to point at more than one possible table."
"""