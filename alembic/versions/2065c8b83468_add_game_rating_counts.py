"""add game rating counts

Revision ID: 2065c8b83468
Revises: 824c9fdef746
Create Date: 2026-09-30 20:51:17.113200

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2065c8b83468'
down_revision: Union[str, Sequence[str], None] = '824c9fdef746'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "games",
        sa.Column("rating_count", sa.Integer(), nullable=True),
    )
    op.add_column(
        "games",
        sa.Column("total_rating", sa.Float(), nullable=True),
    )
    op.add_column(
        "games",
        sa.Column("total_rating_count", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("games", "total_rating_count")
    op.drop_column("games", "total_rating")
    op.drop_column("games", "rating_count")

