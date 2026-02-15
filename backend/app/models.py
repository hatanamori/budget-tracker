from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    closing_day = Column(Integer, nullable=True)
    payment_day = Column(Integer, nullable=True)

    transactions = relationship("Transaction", back_populates="account")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)

    sub_categories = relationship("SubCategory", back_populates="category")


class Sub_category(Base):
    __tablename__ = "sub_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="sub_categories")
    transactions = relationship("Transaction", back_populates="sub_category")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    target_amount = Column(Integer, nullable=False)
    deadline = Column(Date, nullable=True)
    url = Column(String, nullable=True)

    transactions = relationship("Transaction", back_populates="goal")

# --------------------
#  メインテーブル
# --------------------


class Transactions(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date)
    amount = Column(Integer, nullable=False)
    memo = Column(String)

    # 外部キー設定
    account_id = Column(Integer, ForeignKey("accounts.id"))
    sub_category_id = Column(Integer, ForeignKey("sub_categories.id"))
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)

    # リレーション設定
    account = relationship("Account", back_populates="transactions")
    sub_category = relationship("SubCategory", back_populates="transactions")
    goal = relationship("Goal", back_populates="transactions")
