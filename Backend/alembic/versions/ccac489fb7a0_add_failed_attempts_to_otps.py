"""add_failed_attempts_to_otps

Revision ID: ccac489fb7a0
Revises: 113d80f6884d
Create Date: 2026-08-28 19:28:21.905304

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccac489fb7a0'
down_revision: Union[str, Sequence[str], None] = '113d80f6884d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'otps',
        sa.Column('failed_attempts', sa.Integer(), server_default='0', nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('otps', 'failed_attempts')
