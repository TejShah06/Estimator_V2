from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class FloorPlanProject(Base):
    __tablename__ = "floorplan_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Project info
    project_name = Column(String, default="Untitled Project")
    source_type = Column(String, default="ai")  # "ai" or "manual"

    # Analysis results
    rooms_count = Column(Integer, default=0)
    doors_count = Column(Integer, default=0)
    windows_count = Column(Integer, default=0)
    total_area_sqft = Column(Float, default=0.0)
    total_area_m2 = Column(Float, default=0.0)

    # Scale info
    scale_method = Column(String, default="unknown")
    scale_px_per_foot = Column(Float, default=0.0)

    # Room details as JSON string
    rooms_json = Column(Text, nullable=True)

    # Cost breakdown
    estimated_cost = Column(Float, default=0.0)
    flooring_cost = Column(Float, default=0.0)
    painting_cost = Column(Float, default=0.0)
    ceiling_cost = Column(Float, default=0.0)
    electrical_cost = Column(Float, default=0.0)
    plumbing_cost = Column(Float, default=0.0)
    doors_cost = Column(Float, default=0.0)
    windows_cost = Column(Float, default=0.0)

    # Preview image path
    preview_path = Column(String, nullable=True)

    # Analysis time
    analysis_time_seconds = Column(Float, default=0.0)

    # Status: completed, processing, failed
    status = Column(String, default="completed")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User")