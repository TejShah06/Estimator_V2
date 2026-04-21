from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100))
    hashed_password = Column(String(255), nullable=False)
    
    role = Column(String(20), default="engineer")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    #  RELATIONSHIPS (IMPORTANT!)
    manual_estimations = relationship(
        "ManualEstimation",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    floorplan_projects = relationship(
        "FloorPlanProject",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    elevation_views = relationship(
        "FloorPlanElevationView",
        back_populates="uploaded_by",
        foreign_keys="FloorPlanElevationView.uploaded_by_user_id"
    )
