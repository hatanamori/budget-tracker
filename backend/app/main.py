import uvicorn
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 3000番からのアクセスを許可
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
# API のエンドポイント
# ---------------------------------------------
# 口座の作成


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
    db_obj = db.query(models.Account).filter(
        models.Account.id == account_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(db_obj)
    db.commit()
    return {"message": "Account deleted successfully"}

# ---------------------------------------------
# カテゴリ


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
    db_obj = db.query(models.Category).filter(
        models.Category.id == category_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(db_obj)
    db.commit()
    return {"message": "Category deleted successfully"}

# ---------------------------------------------
# サブカテゴリ


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


@app.get("/")
def read_root():
    return {"message": "Welcome to Budget Tracker API!"}


# ---------------------------------------------


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug", reload=True)
