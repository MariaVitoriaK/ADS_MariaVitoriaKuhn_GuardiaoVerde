"""add usernames, primary admin flag, and author snapshots

Revision ID: c3f4a91d2b70
Revises: b512d4502a6c
Create Date: 2026-11-04
"""

import re
import unicodedata
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3f4a91d2b70"
down_revision: Union[str, Sequence[str], None] = "b512d4502a6c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _username_base(name: str, user_id: int) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii").lower()
    base = re.sub(r"[^a-z0-9._-]+", ".", ascii_name).strip("._-")
    base = (base or f"usuario{user_id}")[:30]
    return base if len(base) >= 3 else f"{base}{user_id}"[:30]


def upgrade() -> None:
    connection = op.get_bind()
    usuario = sa.table(
        "usuario",
        sa.column("id_usuario", sa.Integer),
        sa.column("nome", sa.String),
        sa.column("email", sa.String),
        sa.column("username", sa.String),
        sa.column("administrador_principal", sa.Boolean),
    )

    op.add_column("usuario", sa.Column("username", sa.String(), nullable=True))
    op.add_column(
        "usuario",
        sa.Column(
            "administrador_principal",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column("noticia", sa.Column("autor_nome", sa.String(), nullable=True))
    op.add_column("noticia", sa.Column("autor_username", sa.String(), nullable=True))
    op.add_column("comentario", sa.Column("nome_usuario_autor", sa.String(), nullable=True))
    op.add_column("comentario", sa.Column("username_usuario_autor", sa.String(), nullable=True))
    op.add_column("historico_denuncia", sa.Column("nome_admin", sa.String(), nullable=True))
    op.add_column("historico_denuncia", sa.Column("username_admin", sa.String(), nullable=True))

    usuarios = connection.execute(
        sa.select(usuario.c.id_usuario, usuario.c.nome, usuario.c.email).order_by(usuario.c.id_usuario)
    ).mappings()
    nomes_usados: set[str] = set()
    for row in usuarios:
        base = _username_base(row["nome"] or "", row["id_usuario"])
        username = base
        sufixo = 2
        while username.casefold() in nomes_usados:
            final = f".{sufixo}"
            username = f"{base[:30 - len(final)]}{final}"
            sufixo += 1
        nomes_usados.add(username.casefold())
        connection.execute(
            sa.update(usuario)
            .where(usuario.c.id_usuario == row["id_usuario"])
            .values(
                username=username,
                administrador_principal=(row["email"] or "").lower() == "admin@email.com",
            )
        )

    for tabela_nome, nome_coluna, username_coluna in (
        ("noticia", "autor_nome", "autor_username"),
        ("comentario", "nome_usuario_autor", "username_usuario_autor"),
        ("historico_denuncia", "nome_admin", "username_admin"),
    ):
        tabela = sa.table(
            tabela_nome,
            sa.column("id_usuario", sa.Integer),
            sa.column(nome_coluna, sa.String),
            sa.column(username_coluna, sa.String),
        )
        if tabela_nome == "historico_denuncia":
            tabela = sa.table(
                tabela_nome,
                sa.column("id_usuario", sa.Integer),
                sa.column("nome_admin", sa.String),
                sa.column("username_admin", sa.String),
            )
        connection.execute(
            sa.update(tabela)
            .where(tabela.c.id_usuario.is_not(None))
            .values(
                {
                    nome_coluna: sa.select(usuario.c.nome)
                    .where(usuario.c.id_usuario == tabela.c.id_usuario)
                    .scalar_subquery(),
                    username_coluna: sa.select(usuario.c.username)
                    .where(usuario.c.id_usuario == tabela.c.id_usuario)
                    .scalar_subquery(),
                }
            )
        )

    with op.batch_alter_table("usuario") as batch_op:
        batch_op.alter_column("username", existing_type=sa.String(), nullable=False)
    op.create_index(
        "uq_usuario_username_lower",
        "usuario",
        [sa.text("lower(username)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_usuario_username_lower", table_name="usuario")
    op.drop_column("historico_denuncia", "username_admin")
    op.drop_column("historico_denuncia", "nome_admin")
    op.drop_column("comentario", "username_usuario_autor")
    op.drop_column("comentario", "nome_usuario_autor")
    op.drop_column("noticia", "autor_username")
    op.drop_column("noticia", "autor_nome")
    op.drop_column("usuario", "administrador_principal")
    op.drop_column("usuario", "username")
