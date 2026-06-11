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


class AccountUpdate(BaseSchema):
    name: str

# ----- SubCategory のスキーマ -----


class SubCategoryBase(BaseSchema):
    name: str
    category_id: int
    icon_name: Optional[str] = None


class SubCategoryCreate(SubCategoryBase):
    pass


class SubCategory(SubCategoryBase):
    id: int
    category_id: Optional[int] = None

    class Config:
        from_attributes = True


class SubCategoryUpdate(BaseSchema):
    name: Optional[str] = None
    icon_name: Optional[str] = None


# ----- Category のスキーマ -----


class CategoryBase(BaseSchema):
    name: str
    type: str  # 収入 or 支出
    icon_name: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    sub_categories: List[SubCategory] = []


class CategoryUpdate(BaseSchema):
    name: Optional[str] = None
    icon_name: Optional[str] = None


# ----- Goal のスキーマ -----


class GoalBase(BaseSchema):
    name: str
    target_amount: int
    icon_name: Optional[str] = None
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


# ----- RecurringTransaction のスキーマ -----


class RecurringTransactionBase(BaseSchema):
    name: str
    amount: int
    memo: Optional[str] = None
    frequency: str  # "monthly" or "yearly"
    day_of_month: int
    month_of_year: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None
    account_id: int
    sub_category_id: int
    is_active: bool = True

# 入力用


class RecurringTransactionCreate(RecurringTransactionBase):
    pass

# 更新用


class RecurringTransactionUpdate(BaseSchema):
    name: Optional[str] = None
    amount: Optional[int] = None
    memo: Optional[str] = None
    frequency: Optional[str] = None
    day_of_month: Optional[int] = None
    month_of_year: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    account_id: Optional[int] = None
    sub_category_id: Optional[int] = None
    is_active: Optional[bool] = None

# 出力用


class RecurringTransaction(RecurringTransactionBase):
    id: int
    last_applied_date: Optional[date] = None
    account: Optional[Account] = None
    sub_category: Optional[SubCategory] = None


# ----- CategoryBudget のスキーマ -----


class CategoryBudgetBase(BaseSchema):
    category_id: int
    amount: int


class CategoryBudgetCreate(CategoryBudgetBase):
    pass


class CategoryBudgetUpdate(BaseSchema):
    amount: int


class CategoryBudget(CategoryBudgetBase):
    id: int
    category: Optional[Category] = None
