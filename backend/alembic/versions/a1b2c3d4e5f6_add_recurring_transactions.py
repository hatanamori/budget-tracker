"""add recurring_transactions table

Revision ID: a1b2c3d4e5f6
Revises: c594cc63297c
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c594cc63297c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'recurring_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('memo', sa.String(), nullable=True),
        sa.Column('frequency', sa.String(length=50), nullable=False),
        sa.Column('day_of_month', sa.Integer(), nullable=False),
        sa.Column('month_of_year', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('last_applied_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('sub_category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id']),
        sa.ForeignKeyConstraint(['sub_category_id'], ['sub_categories.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_recurring_transactions_id'), 'recurring_transactions', ['id'], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_recurring_transactions_id'), table_name='recurring_transactions')
    op.drop_table('recurring_transactions')
