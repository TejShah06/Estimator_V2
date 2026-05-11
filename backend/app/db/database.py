# app/db/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


engine = create_engine(
    DATABASE_URL,

    # Pool settings
    pool_size       = 20,    # Keep 20 connections open always
    max_overflow    = 40,    # Allow 40 extra when busy (total 60)
    pool_timeout    = 30,    # Wait max 30s for a free connection
    pool_pre_ping   = True,  # Test connection before using it
    pool_recycle    = 1800,  # Recycle connections every 30 min

    # Query settings
    echo            = False, # Set True to debug slow queries
)

SessionLocal = sessionmaker(
    autocommit = False,
    autoflush  = False,
    bind       = engine,
)

Base = declarative_base()