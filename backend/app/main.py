import uvicorn
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

app = FastAPI()

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

# ---------------------------------------------
# カテゴリ


@app.post("/categories/", response_model=schemas.Category)
def create_category(account: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**account.model_dump())

    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@app.get("/categories/", response_model=List[schemas.Category])
def read_category(skip: int = 0, limit: int = Query(100, le=1000), db: Session = Depends(get_db)):
    return db.query(models.Category).offset(skip).limit(limit).all()

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

# ---------------------------------------------


@app.get("/")
def read_root():
    return {"message": "Welcome to Budget Tracker API!"}


# ---------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 3000番からのアクセスを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug", reload=True)
