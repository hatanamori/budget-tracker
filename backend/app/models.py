from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    closing_day = Column(Integer, nullable=True)
    payment_day = Column(Integer, nullable=True)

    transactions = relationship("Transaction", back_populates="account")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(255), nullable=False)
    icon_name = Column(String(255), nullable=True)

    sub_categories = relationship(
        "SubCategory",
        back_populates="category",
        cascade="all, delete-orphan"
    )


class SubCategory(Base):
    __tablename__ = "sub_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    icon_name = Column(String(255), nullable=True)

    category = relationship("Category", back_populates="sub_categories")
    transactions = relationship("Transaction", back_populates="sub_category")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    target_amount = Column(Integer, nullable=False)
    icon_name = Column(String(255), nullable=True)
    deadline = Column(Date, nullable=True)
    url = Column(String, nullable=True)

    transactions = relationship("Transaction", back_populates="goal")

# --------------------
#  メインテーブル
# --------------------


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Integer, nullable=False)
    memo = Column(String)

    # 外部キー設定
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    sub_category_id = Column(Integer, ForeignKey(
        "sub_categories.id"), nullable=False)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)

    # リレーション設定
    account = relationship("Account", back_populates="transactions")
    sub_category = relationship("SubCategory", back_populates="transactions")
    goal = relationship("Goal", back_populates="transactions")
