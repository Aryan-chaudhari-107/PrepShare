"""add duration_minutes and round_tags to post_rounds

Revision ID: d4e9182a5c10
Revises: 113d80f6884d, 7fba717d6792
Create Date: 2026-08-29 20:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e9182a5c10'
down_revision: Union[str, Sequence[str], None] = ('113d80f6884d', '7fba717d6792')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw SQL with IF NOT EXISTS to be fully idempotent
    op.execute("ALTER TABLE post_rounds ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;")
    op.execute("ALTER TABLE post_rounds ADD COLUMN IF NOT EXISTS round_tags VARCHAR;")


def downgrade() -> None:
    op.drop_column('post_rounds', 'round_tags')
    op.drop_column('post_rounds', 'duration_minutes')
