import calendar
import logging
import uvicorn
from contextlib import asynccontextmanager
from datetime import date
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from apscheduler.schedulers.background import BackgroundScheduler
from . import models, schemas, database

logger = logging.getLogger(__name__)


# ---------------------------------------------
# 固定費の自動登録ロジック
# ---------------------------------------------

def _effective_day(year: int, month: int, day: int) -> int:
    """指定日が月末を超える場合は月末に丸める（例: 31日 → 2月28日）"""
    return min(day, calendar.monthrange(year, month)[1])


def apply_recurring_transactions(db: Session) -> int:
    today = date.today()
    actives = db.query(models.RecurringTransaction).filter(
        models.RecurringTransaction.is_active == True,
        models.RecurringTransaction.start_date <= today,
    ).all()

    created = 0
    for rt in actives:
        target_date = None

        if rt.frequency == "monthly":
            eff_day = _effective_day(today.year, today.month, rt.day_of_month)
            if today.day >= eff_day:
                target_date = date(today.year, today.month, eff_day)
            else:
                prev_year = today.year if today.month > 1 else today.year - 1
                prev_month = today.month - 1 if today.month > 1 else 12
                eff_day_prev = _effective_day(prev_year, prev_month, rt.day_of_month)
                target_date = date(prev_year, prev_month, eff_day_prev)

        elif rt.frequency == "yearly":
            if rt.month_of_year is None:
                continue
            eff_day = _effective_day(today.year, rt.month_of_year, rt.day_of_month)
            if today.month > rt.month_of_year or (
                today.month == rt.month_of_year and today.day >= eff_day
            ):
                target_date = date(today.year, rt.month_of_year, eff_day)
            else:
                eff_day_prev = _effective_day(today.year - 1, rt.month_of_year, rt.day_of_month)
                target_date = date(today.year - 1, rt.month_of_year, eff_day_prev)

        if target_date is None:
            continue
        if target_date < rt.start_date:
            continue
        if rt.end_date and target_date > rt.end_date:
            continue
        if rt.last_applied_date is not None and rt.last_applied_date >= target_date:
            continue

        db.add(models.Transaction(
            date=target_date,
            amount=rt.amount,
            memo=rt.memo,
            account_id=rt.account_id,
            sub_category_id=rt.sub_category_id,
        ))
        rt.last_applied_date = target_date
        created += 1

    if created > 0:
        db.commit()
        logger.info("固定費自動登録: %d件作成", created)

    return created


def _scheduled_job():
    db = database.SessionLocal()
    try:
        apply_recurring_transactions(db)
    except Exception as e:
        db.rollback()
        logger.exception("固定費の自動登録中にエラーが発生しました: %s", e)
    finally:
        db.close()


# ---------------------------------------------
# アプリ起動・終了時の処理
# ---------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時に未適用の固定費を処理
    _scheduled_job()

    scheduler = BackgroundScheduler()
    scheduler.add_job(_scheduled_job, "cron", hour=0, minute=0)
    scheduler.start()

    yield

    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------
# DBセッションを取得するための依存関係
# ---------------------------------------------


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------
# 口座
# ---------------------------------------------


@app.post("/accounts/", response_model=schemas.Account)
def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    db_account = models.Account(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@app.get("/accounts/", response_model=List[schemas.Account])
def read_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Account).offset(skip).limit(limit).all()


@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(db_obj)
    db.commit()
    return {"message": "Account deleted successfully"}


# ---------------------------------------------
# カテゴリ
# ---------------------------------------------


@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@app.get("/categories/", response_model=List[schemas.Category])
def read_category(skip: int = 0, limit: int = Query(100, le=1000), db: Session = Depends(get_db)):
    return db.query(models.Category).offset(skip).limit(limit).all()


@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_obj)
    db.commit()
    return {"message": "Category deleted successfully"}


# ---------------------------------------------
# サブカテゴリ
# ---------------------------------------------


@app.post("/sub-categories/", response_model=schemas.SubCategory)
def create_sub_category(sub_category: schemas.SubCategoryCreate, db: Session = Depends(get_db)):
    db_sub = models.SubCategory(**sub_category.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub


@app.get("/sub-categories/", response_model=List[schemas.SubCategory])
def read_sub_category(skip: int = 0, limit: int = Query(100, le=1000), db: Session = Depends(get_db)):
    return db.query(models.SubCategory).offset(skip).limit(limit).all()


@app.delete("/sub-categories/{sub_category_id}")
def delete_sub_category(sub_category_id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.SubCategory).filter(
        models.SubCategory.id == sub_category_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    db.delete(db_obj)
    db.commit()
    return {"message": "SubCategory deleted successfully"}


# ---------------------------------------------
# 目標
# ---------------------------------------------


@app.post("/goals/", response_model=schemas.Goal)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    db_goal = models.Goal(**goal.model_dump())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@app.get("/goals/", response_model=List[schemas.Goal])
def read_goals(skip: int = 0, limit: int = Query(100, le=1000), db: Session = Depends(get_db)):
    return db.query(models.Goal).offset(skip).limit(limit).all()


@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(db_obj)
    db.commit()
    return {"message": "Goal deleted successfully"}


# ---------------------------------------------
# 取引
# ---------------------------------------------


@app.post("/transactions/", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = models.Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@app.get("/transactions/", response_model=List[schemas.Transaction])
def read_transactions(skip: int = 0, limit: int = Query(100, le=1000), db: Session = Depends(get_db)):
    return db.query(models.Transaction).offset(skip).limit(limit).all()


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_obj = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_obj)
    db.commit()
    return {"message": "Transaction deleted successfully"}


# ---------------------------------------------
# 固定費（繰り返し取引）
# ---------------------------------------------


@app.get("/recurring-transactions/", response_model=List[schemas.RecurringTransaction])
def read_recurring_transactions(
    skip: int = 0, limit: int = Query(100, le=1000), db: Session = Depends(get_db)
):
    return db.query(models.RecurringTransaction).offset(skip).limit(limit).all()


@app.post("/recurring-transactions/", response_model=schemas.RecurringTransaction)
def create_recurring_transaction(
    rt: schemas.RecurringTransactionCreate, db: Session = Depends(get_db)
):
    db_rt = models.RecurringTransaction(**rt.model_dump())
    db.add(db_rt)
    db.commit()
    db.refresh(db_rt)
    return db_rt


@app.put("/recurring-transactions/{rt_id}", response_model=schemas.RecurringTransaction)
def update_recurring_transaction(
    rt_id: int, update: schemas.RecurringTransactionUpdate, db: Session = Depends(get_db)
):
    db_rt = db.query(models.RecurringTransaction).filter(
        models.RecurringTransaction.id == rt_id).first()
    if not db_rt:
        raise HTTPException(status_code=404, detail="RecurringTransaction not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(db_rt, field, value)
    db.commit()
    db.refresh(db_rt)
    return db_rt


@app.delete("/recurring-transactions/{rt_id}")
def delete_recurring_transaction(rt_id: int, db: Session = Depends(get_db)):
    db_rt = db.query(models.RecurringTransaction).filter(
        models.RecurringTransaction.id == rt_id).first()
    if not db_rt:
        raise HTTPException(status_code=404, detail="RecurringTransaction not found")
    db.delete(db_rt)
    db.commit()
    return {"message": "RecurringTransaction deleted successfully"}


# ---------------------------------------------
# 予算
# ---------------------------------------------


@app.get("/budgets/", response_model=List[schemas.CategoryBudget])
def read_budgets(db: Session = Depends(get_db)):
    return db.query(models.CategoryBudget).all()


@app.put("/budgets/{category_id}", response_model=schemas.CategoryBudget)
def upsert_budget(
    category_id: int, update: schemas.CategoryBudgetUpdate, db: Session = Depends(get_db)
):
    existing = db.query(models.CategoryBudget).filter(
        models.CategoryBudget.category_id == category_id
    ).first()
    if existing:
        existing.amount = update.amount
        db.commit()
        db.refresh(existing)
        return existing
    new_budget = models.CategoryBudget(category_id=category_id, amount=update.amount)
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget


@app.delete("/budgets/{category_id}")
def delete_budget(category_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.CategoryBudget).filter(
        models.CategoryBudget.category_id == category_id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(existing)
    db.commit()
    return {"message": "Budget deleted successfully"}


# ---------------------------------------------


@app.get("/")
def read_root():
    return {"message": "Welcome to Budget Tracker API!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug", reload=True)
