from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Text, Boolean, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlanProject(Base):
    __tablename__ = "floorplan_projects"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    # PROJECT IDENTIFICATION
    project_code = Column(String(50), unique=True, nullable=True)
    project_name = Column(String(100), nullable=False, default="Untitled Project")
    description = Column(Text, nullable=True)  # ADD THIS

    #  BUILDING INFORMATION
    building_type = Column(String(50), nullable=True)  #  ADD THIS
    building_style = Column(String(50), nullable=True)  #  ADD THIS
    total_floors = Column(Integer, default=1)

    # SOURCE FILES
    original_image_path = Column(String(500), nullable=True)
    processed_image_path = Column(String(500), nullable=True)
    preview_path = Column(String(255), nullable=True)

    #  JSON DATA STORES
    rooms_json = Column(Text, nullable=True)
    openings_json = Column(Text, nullable=True)
    walls_json = Column(Text, nullable=True)
    analysis_metadata_json = Column(Text, nullable=True)

    #  ANALYSIS CONFIGURATION
    scale_method = Column(String(50), default='auto')
    scale_px_per_foot = Column(Float, nullable=True)
    pixels_per_meter = Column(Float, nullable=True)

    # SOURCE TRACKING
    source_type = Column(String(20), default='ai')
    has_floor_plan_image = Column(Boolean, default=True)
    has_geometry_data = Column(Boolean, default=True)

    # SUMMARY STATISTICS
    rooms_count = Column(Integer, default=0)
    doors_count = Column(Integer, default=0)
    windows_count = Column(Integer, default=0)
    walls_count = Column(Integer, default=0)

    # AREA CALCULATIONS
    total_area_sqft = Column(Float, default=0.0)
    total_area_m2 = Column(Float, default=0.0)
    built_up_area_sqft = Column(Float, nullable=True)
    carpet_area_sqft = Column(Float, nullable=True)

    # COST SUMMARY
    estimated_cost = Column(Float, default=0.0)
    cost_per_sqft = Column(Float, nullable=True)

    # INDIVIDUAL COST COMPONENTS
    flooring_cost = Column(Float, default=0.0)
    painting_cost = Column(Float, default=0.0)
    ceiling_cost = Column(Float, default=0.0)
    electrical_cost = Column(Float, default=0.0)
    plumbing_cost = Column(Float, default=0.0)
    doors_cost = Column(Float, default=0.0)
    windows_cost = Column(Float, default=0.0)

    # PROCESSING INFORMATION
    status = Column(String(20), default='processing')
    processing_stage = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    analysis_time_seconds = Column(Float, default=0.0)

    # TIMESTAMPS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # SOFT DELETE
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)

    #  RELATIONSHIPS
    user = relationship("User", back_populates="floorplan_projects")
    rooms = relationship("FloorPlanRoom", back_populates="project", cascade="all, delete-orphan")
    openings = relationship("FloorPlanOpening", back_populates="project", cascade="all, delete-orphan")
    walls = relationship("FloorPlanWall", back_populates="project", cascade="all, delete-orphan")
    costs = relationship("FloorPlanCost", back_populates="project", cascade="all, delete-orphan")
    model_3d = relationship("FloorPlan3DModel", back_populates="project", uselist=False)
    elevation_views = relationship("FloorPlanElevationView", back_populates="project", cascade="all, delete-orphan")

    
def to_3d_generation_dict(self):
    """Convert project to dictionary for 3D generation"""
    return {
        "project_id": self.id,
        "project_name": self.project_name,
        "rooms_json": self.rooms_json,
        "openings_json": self.openings_json,
        "walls_json": self.walls_json,
        "total_area_sqft": self.total_area_sqft,
        "rooms_count": self.rooms_count,
        "doors_count": self.doors_count,
        "windows_count": self.windows_count,
        "walls_count": self.walls_count,
        "total_floors": self.total_floors,
    }