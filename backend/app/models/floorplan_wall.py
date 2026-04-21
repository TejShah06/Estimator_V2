from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Boolean, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlanWall(Base):
    __tablename__ = "floorplan_walls"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("floorplan_projects.id", ondelete="CASCADE"), nullable=False)

    # Wall identification
    wall_number = Column(Integer, nullable=False)
    wall_type = Column(String(20), nullable=False, default='interior')
    wall_label = Column(String(50), nullable=True)

    # Geometry - nullable for manual entries
    start_x = Column(Float, nullable=True)
    start_y = Column(Float, nullable=True)
    end_x = Column(Float, nullable=True)
    end_y = Column(Float, nullable=True)

    # Dimensions
    length_ft = Column(Float, nullable=True)
    thickness_ft = Column(Float, default=0.5)
    height_ft = Column(Float, default=10.0)

    # Floor level
    floor_level = Column(Integer, default=0)

    # Room relationships
    room_id_left = Column(Integer, ForeignKey("floorplan_rooms.id", ondelete="SET NULL"), nullable=True)
    room_id_right = Column(Integer, ForeignKey("floorplan_rooms.id", ondelete="SET NULL"), nullable=True)

    # Material
    material = Column(String(50), default='brick')
    finish = Column(String(50), nullable=True)

    # Features
    has_opening = Column(Boolean, default=False)
    is_structural = Column(Boolean, default=False)
    is_load_bearing = Column(Boolean, default=False)

    # 3D data
    normal_vector = Column(JSONB, nullable=True)
    texture_id = Column(String(100), nullable=True)

    # Tracking
    has_geometry = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("FloorPlanProject", back_populates="walls")