"""Confirm user soft delete columns

Revision ID: 6b3306db7ffe
Revises: f9385165250b
Create Date: 2026-04-27 11:25:43.568646

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b3306db7ffe'
down_revision: Union[str, Sequence[str], None] = 'f9385165250b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
