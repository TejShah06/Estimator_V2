from sqlalchemy import Column, Integer, BigInteger, Float, ForeignKey, DateTime, String, Boolean, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlanElevationView(Base):
    __tablename__ = "floorplan_elevation_views"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("floorplan_projects.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # View identification
    view_code = Column(String(50), nullable=True)
    view_type = Column(String(20), nullable=False)
    view_direction = Column(String(20), nullable=True)
    view_name = Column(String(100), nullable=True)
    section_line = Column(String(50), nullable=True)

    # File information
    image_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=True)
    processed_image_path = Column(String(500), nullable=True)

    # Image properties
    image_width_px = Column(Integer, nullable=True)
    image_height_px = Column(Integer, nullable=True)
    image_format = Column(String(20), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    dpi = Column(Integer, nullable=True)

    # Scale information
    scale_ratio = Column(Float, nullable=True)
    scale_text = Column(String(100), nullable=True)
    has_scale_bar = Column(Boolean, default=False)
    scale_bar_length_px = Column(Integer, nullable=True)
    scale_bar_represents_ft = Column(Float, nullable=True)

    # Extracted measurements
    extracted_height_ft = Column(Float, nullable=True)
    extracted_width_ft = Column(Float, nullable=True)
    extraction_method = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)

    # Analysis results
    detected_floors = Column(Integer, nullable=True)
    floor_heights = Column(JSONB, nullable=True)
    detected_roof_type = Column(String(50), nullable=True)
    detected_windows_count = Column(Integer, nullable=True)
    detected_doors_count = Column(Integer, nullable=True)

    # Features detected
    has_dimensions = Column(Boolean, default=False)
    has_annotations = Column(Boolean, default=False)
    has_grid = Column(Boolean, default=False)

    # Processing information
    processing_status = Column(String(20), default='pending')
    processing_error = Column(Text, nullable=True)
    processing_time_seconds = Column(Float, nullable=True)

    # Metadata
    notes = Column(Text, nullable=True)

    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # ✅ FIXED RELATIONSHIPS
    project = relationship("FloorPlanProject", back_populates="elevation_views")
    uploaded_by = relationship(
        "User",
        back_populates="elevation_views",
        foreign_keys=[uploaded_by_user_id]
    )

    def to_dict(self):
        return {
            "id": self.id,
            "view_type": self.view_type,
            "view_direction": self.view_direction,
            "image_path": self.image_path,
            "extracted_height_ft": self.extracted_height_ft,
            "confidence_score": self.confidence_score,
            "processing_status": self.processing_status,
        }