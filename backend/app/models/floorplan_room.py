from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Boolean, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlanRoom(Base):
    __tablename__ = "floorplan_rooms"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("floorplan_projects.id", ondelete="CASCADE"), nullable=False)

    # Room identification
    room_number = Column(Integer, nullable=False)
    room_label = Column(String(50), nullable=True)
    room_type = Column(String(50), nullable=False)
    room_name = Column(String(100), nullable=True)

    # Floor information
    floor_level = Column(Integer, default=0)

    # Geometry (bounding box) - nullable for manual entries
    x_min = Column(Float, nullable=True)
    y_min = Column(Float, nullable=True)
    x_max = Column(Float, nullable=True)
    y_max = Column(Float, nullable=True)

    # Centroid
    center_x = Column(Float, nullable=True)
    center_y = Column(Float, nullable=True)

    # Measurements
    area_sqft = Column(Float, nullable=True)
    area_m2 = Column(Float, nullable=True)
    perimeter_ft = Column(Float, nullable=True)
    length_ft = Column(Float, nullable=True)
    width_ft = Column(Float, nullable=True)

    # 3D dimensions
    ceiling_height_ft = Column(Float, default=10.0)
    floor_to_floor_height_ft = Column(Float, nullable=True)

    # Surface areas
    wall_area_sqft = Column(Float, nullable=True)
    ceiling_area_sqft = Column(Float, nullable=True)
    floor_area_sqft = Column(Float, nullable=True)

    # Room features
    has_window = Column(Boolean, default=False)
    has_door = Column(Boolean, default=False)
    is_wet_room = Column(Boolean, default=False)
    requires_hvac = Column(Boolean, default=True)
    requires_electrical = Column(Boolean, default=True)

    # Complex geometry
    polygon_points = Column(JSONB, nullable=True)

    # Tracking
    has_geometry = Column(Boolean, default=False)

    # Metadata
    notes = Column(Text, nullable=True)
    detected_confidence = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("FloorPlanProject", back_populates="rooms")
    
    def to_dict(self):
        """Helper method to convert to dictionary"""
        return {
            "id": self.id,
            "room_number": self.room_number,
            "room_type": self.room_type,
            "room_name": self.room_name,
            "area_sqft": self.area_sqft,
            "has_window": self.has_window,
            "has_door": self.has_door,
            "has_geometry": self.has_geometry,
        }