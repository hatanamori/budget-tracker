from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# ----- 共通する項目の設定 -----


class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# ----- Account のスキーマ -----


class AccountBase(BaseSchema):
    name: str
    closing_day: Optional[int] = None
    payment_day: Optional[int] = None


class AccountCreate(AccountBase):
    pass


class Account(AccountBase):
    id: int

# ----- SubCategory のスキーマ -----


class SubCategoryBase(BaseSchema):
    name: str
    category_id: int


class SubCategoryCreate(SubCategoryBase):
    pass


class SubCategory(SubCategoryBase):
    id: int
    category_id: Optional[int] = None

    class Config:
        from_attributes = True


# ----- Category のスキーマ -----


class CategoryBase(BaseSchema):
    name: str
    type: str  # 収入 or 支出


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    sub_categories: List[SubCategory] = []


# ----- Goal のスキーマ -----


class GoalBase(BaseSchema):
    name: str
    target_amount: int
    deadline: Optional[date] = None
    url: Optional[str] = None


class GoalCreate(GoalBase):
    pass


class Goal(GoalBase):
    id: int

# ----- Transaction のスキーマ -----


class TransactionBase(BaseSchema):
    date: date
    amount: int
    memo: Optional[str] = None
    account_id: int
    sub_category_id: int
    goal_id: Optional[int] = None

# 入力用


class TransactionCreate(TransactionBase):
    pass

# 出力用


class Transaction(TransactionBase):
    id: int
    # 紐づく名前データも一緒に返す
    account: Optional[Account] = None
    # sub_category: Optional[SubCategory] = None
