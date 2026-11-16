"""Merge library and game media migrations

Revision ID: abf4f7148c0c
Revises: 35b7a3158120, bd19c7de5cbf
Create Date: 2026-10-05 19:07:25.745906

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abf4f7148c0c'
down_revision: Union[str, Sequence[str], None] = ('35b7a3158120', 'bd19c7de5cbf')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
