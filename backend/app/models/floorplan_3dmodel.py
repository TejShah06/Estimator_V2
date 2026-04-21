from sqlalchemy import Column, Integer, BigInteger, Float, ForeignKey, DateTime, String, Boolean, Text, func
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlan3DModel(Base):
    __tablename__ = "floorplan_3d_models"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("floorplan_projects.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Model identification
    model_code = Column(String(50), unique=True, nullable=True)
    model_name = Column(String(100), nullable=True)

    # Model files (relative paths)
    obj_file_path = Column(String(500), nullable=True)
    glb_file_path = Column(String(500), nullable=True)
    fbx_file_path = Column(String(500), nullable=True)
    stl_file_path = Column(String(500), nullable=True)
    usdz_file_path = Column(String(500), nullable=True)
    dae_file_path = Column(String(500), nullable=True)

    # Thumbnails
    thumbnail_front = Column(String(500), nullable=True)
    thumbnail_top = Column(String(500), nullable=True)
    thumbnail_side = Column(String(500), nullable=True)
    thumbnail_perspective = Column(String(500), nullable=True)

    # Generation metadata
    generation_method = Column(String(50), nullable=False, default='rule_based')
    algorithm_version = Column(String(20), nullable=True)
    model_version = Column(String(20), default='1.0')
    generator_software = Column(String(100), nullable=True)

    # 3D statistics
    vertices_count = Column(Integer, nullable=True)
    faces_count = Column(Integer, nullable=True)
    edges_count = Column(Integer, nullable=True)
    polygons_count = Column(Integer, nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)

    # Bounding box
    bounding_box_dimensions = Column(JSONB, nullable=True)
    min_point = Column(JSONB, nullable=True)
    max_point = Column(JSONB, nullable=True)

    # Height configuration
    default_height_ft = Column(Float, default=10.0)
    min_height_ft = Column(Float, nullable=True)
    max_height_ft = Column(Float, nullable=True)
    height_source = Column(String(50), default='default')

    # Elevation views
    has_elevation_views = Column(Boolean, default=False)
    elevation_views_count = Column(Integer, default=0)

    # Quality metrics (0.0 to 1.0)
    reconstruction_accuracy = Column(Float, nullable=True)
    mesh_quality_score = Column(Float, nullable=True)
    geometry_validity_score = Column(Float, nullable=True)

    # Mesh properties
    has_textures = Column(Boolean, default=False)
    has_materials = Column(Boolean, default=False)
    has_normals = Column(Boolean, default=True)
    has_uvs = Column(Boolean, default=False)
    is_watertight = Column(Boolean, default=False)
    is_manifold = Column(Boolean, default=False)

    # Features included
    includes_interior_walls = Column(Boolean, default=True)
    includes_openings = Column(Boolean, default=True)
    includes_roof = Column(Boolean, default=False)
    includes_foundation = Column(Boolean, default=False)
    includes_furniture = Column(Boolean, default=False)
    includes_landscaping = Column(Boolean, default=False)

    # LOD (Level of Detail)
    lod_level = Column(String(20), default='medium')
    has_multiple_lods = Column(Boolean, default=False)

    # Processing information
    generation_time_seconds = Column(Float, nullable=True)
    processing_status = Column(String(20), default='completed')
    processing_logs = Column(Text, nullable=True)

    # Metadata
    notes = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship (one-to-one)
    project = relationship("FloorPlanProject", back_populates="model_3d")
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "model_code": self.model_code,
            "obj_file_path": self.obj_file_path,
            "glb_file_path": self.glb_file_path,
            "generation_method": self.generation_method,
            "vertices_count": self.vertices_count,
            "faces_count": self.faces_count,
            "processing_status": self.processing_status,
        }