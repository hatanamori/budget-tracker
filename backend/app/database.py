from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@db:5432/budget_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
