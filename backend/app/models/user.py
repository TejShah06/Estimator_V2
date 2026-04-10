from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="engineer")  # admin / engineer

    # ✅ Relationships moved inside class
    estimates = relationship("Estimate", back_populates="user")
    floorplan_projects = relationship("FloorPlanProject", back_populates="user")