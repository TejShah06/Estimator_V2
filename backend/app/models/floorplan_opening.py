from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Boolean, Text, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlanOpening(Base):
    __tablename__ = "floorplan_openings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("floorplan_projects.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("floorplan_rooms.id", ondelete="SET NULL"), nullable=True)
    wall_id = Column(Integer, ForeignKey("floorplan_walls.id", ondelete="SET NULL"), nullable=True)

    # Opening identification
    opening_number = Column(Integer, nullable=False)
    opening_type = Column(String(20), nullable=False)  # door, window, etc.
    opening_subtype = Column(String(50), nullable=True)
    opening_name = Column(String(100), nullable=True)

    # Position - nullable for manual entries
    x_position = Column(Float, nullable=True)
    y_position = Column(Float, nullable=True)
    wall_position_ratio = Column(Float, nullable=True)

    # Orientation
    wall_side = Column(String(20), nullable=True)
    orientation_degrees = Column(Float, nullable=True)

    # Dimensions
    width_ft = Column(Float, nullable=True)
    height_ft = Column(Float, nullable=True)
    sill_height_ft = Column(Float, default=0)
    head_height_ft = Column(Float, nullable=True)

    # Features
    is_exterior = Column(Boolean, default=False)
    swing_direction = Column(String(20), nullable=True)
    material = Column(String(50), default='wood')
    glass_type = Column(String(50), nullable=True)

    # Costing
    unit_cost = Column(Float, nullable=True)
    installation_cost = Column(Float, nullable=True)

    # Tracking
    has_position = Column(Boolean, default=False)

    # Metadata
    notes = Column(Text, nullable=True)
    detected_confidence = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("FloorPlanProject", back_populates="openings")
    
    def to_dict(self):
        return {
            "id": self.id,
            "opening_type": self.opening_type,
            "width_ft": self.width_ft,
            "height_ft": self.height_ft,
            "is_exterior": self.is_exterior,
        }