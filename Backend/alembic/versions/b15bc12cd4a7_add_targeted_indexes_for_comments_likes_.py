"""add_targeted_indexes_for_comments_likes_bookmarks

Revision ID: b15bc12cd4a7
Revises: ccac489fb7a0
Create Date: 2026-08-28 19:55:31.010523

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b15bc12cd4a7'
down_revision: Union[str, Sequence[str], None] = 'ccac489fb7a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index('ix_comments_post_id_created_at', 'comments', ['post_id', 'created_at'])
    op.create_index('ix_likes_post_id', 'likes', ['post_id'])
    op.create_index('ix_bookmarks_user_id_created_at', 'bookmarks', ['user_id', 'created_at'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_bookmarks_user_id_created_at', table_name='bookmarks')
    op.drop_index('ix_likes_post_id', table_name='likes')
    op.drop_index('ix_comments_post_id_created_at', table_name='comments')
