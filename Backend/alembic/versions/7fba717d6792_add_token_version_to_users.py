"""add token_version to users

Revision ID: 7fba717d6792
Revises: b15bc12cd4a7
Create Date: 2026-08-28 21:55:49.380382

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fba717d6792'
down_revision: Union[str, Sequence[str], None] = 'b15bc12cd4a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column('token_version', sa.Integer(), server_default='1', nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'token_version')
