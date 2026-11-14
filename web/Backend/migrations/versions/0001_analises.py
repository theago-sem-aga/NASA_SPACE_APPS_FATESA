"""Análises reprodutíveis; não altera o índice de ingestão existente."""

import sqlalchemy as sa
from alembic import op

revision = "0001_analises"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "analises",
        sa.Column("analise_id", sa.String(36), primary_key=True),
        sa.Column("criada_em_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("versao_motor", sa.String(80), nullable=False),
        sa.Column("entrada", sa.JSON(), nullable=False),
        sa.Column("resposta", sa.JSON(), nullable=False),
        sa.Column("coleta", sa.JSON(), nullable=False),
    )
    op.create_index("ix_analises_criada_em_utc", "analises", ["criada_em_utc"])


def downgrade():
    op.drop_index("ix_analises_criada_em_utc", table_name="analises")
    op.drop_table("analises")
