
"""adiciona coluna bloqueado_ate

Revision ID: b512d4502a6c
Revises: 82eebe030e4d
Create Date: 2026-11-03 19:40:48.947074
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b512d4502a6c'
down_revision: Union[str, Sequence[str], None] = '82eebe030e4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'usuario',
        sa.Column('bloqueado_ate', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('usuario', 'bloqueado_ate')
