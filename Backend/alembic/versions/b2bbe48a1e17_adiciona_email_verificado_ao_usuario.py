"""adiciona email_verificado ao usuario

Revision ID: b2bbe48a1e17
Revises: c3f4a91d2b70
Create Date: 2026-11-13 19:47:11.309411

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2bbe48a1e17'
down_revision: Union[str, Sequence[str], None] = 'c3f4a91d2b70'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.add_column(
        'usuario',
        sa.Column(
            'email_verificado',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )
    op.add_column(
        'usuario',
        sa.Column('email_verificacao_token', sa.String(), nullable=True)
    )
    op.add_column(
        'usuario',
        sa.Column('email_verificacao_expira_em', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('usuario', 'email_verificacao_expira_em')
    op.drop_column('usuario', 'email_verificacao_token')
    op.drop_column('usuario', 'email_verificado')
