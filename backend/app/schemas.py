from pydantic import BaseModel
from datetime import date
from typing import Optional

# ----- 共通する項目の設定 -----


class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# ----- Account のスキーマ -----


class AccountBase(BaseSchema):
    name: str
    type: str
    closing_day: Optional[int] = None
    payment_day: Optional[int] = None


class AccountCreate(AccountBase):
    pass


class Account(AccountBase):
    id: int

# ----- Category のスキーマ -----


class CategoryBase(BaseSchema):
    name: str
    type: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int

# ----- SubCategory のスキーマ -----


class SubCategoryBase(BaseSchema):
    name: str
    category_id: int


class SubCategoryCreate(SubCategoryBase):
    pass


class SubCategory(SubCategoryBase):
    id: int
    # category: Category # 親カテゴリの情報を含めたい場合はコメントアウトを外す

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
