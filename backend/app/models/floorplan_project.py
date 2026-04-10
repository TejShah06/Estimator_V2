from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Text, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlanProject(Base):
    __tablename__ = "floorplan_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Project info
    project_name = Column(String(100), default="Untitled Project")
    source_type = Column(String(20), default="ai")  # "ai" or "manual"

    # Analysis results
    rooms_count = Column(Integer, default=0)
    doors_count = Column(Integer, default=0)
    windows_count = Column(Integer, default=0)
    total_area_sqft = Column(Float, default=0.0)
    total_area_m2 = Column(Float, default=0.0)

    # Scale info
    scale_method = Column(String(50), default="unknown")
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
    preview_path = Column(String(255), nullable=True ,default=None)

    # Analysis time
    analysis_time_seconds = Column(Float, default=0.0)

    # Status: completed, processing, failed
    status = Column(String(20), default="completed")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="floorplan_projects")