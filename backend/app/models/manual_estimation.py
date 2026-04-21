from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Boolean, Text, func
from sqlalchemy.orm import relationship
from app.db.database import Base


class ManualEstimation(Base):
    """
    Manual estimation created by user form submission.
    Stores complete calculation history for audit trail.
    """
    __tablename__ = "manual_estimations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # ✅ PROJECT IDENTIFICATION
    estimation_code = Column(String(50), unique=True, nullable=True)
    estimation_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    # ✅ INPUT DATA
    area_sqft = Column(Float, nullable=False)
    area_m2 = Column(Float, nullable=True)
    floors = Column(Integer, nullable=False, default=1)
    wastage_percent = Column(Float, nullable=False, default=5.0)

    # ✅ MIX CONFIGURATION
    mix_type = Column(String(20), nullable=False)
    cement_part = Column(Float, nullable=False)
    sand_part = Column(Float, nullable=False)
    aggregate_part = Column(Float, nullable=False)

    # ✅ RATE CONFIGURATION
    steel_rate_per_kg = Column(Float, nullable=False)
    cement_rate_per_bag = Column(Float, nullable=False)
    sand_rate_per_ton = Column(Float, nullable=False)
    aggregate_rate_per_ton = Column(Float, nullable=False)
    brick_rate_per_unit = Column(Float, nullable=False)
    paint_rate_per_liter = Column(Float, nullable=False)

    # ✅ CALCULATED MATERIALS
    concrete_volume_m3 = Column(Float, nullable=True)
    dry_volume_m3 = Column(Float, nullable=True)
    steel_kg = Column(Float, nullable=True)
    cement_bags = Column(Float, nullable=True)
    sand_ton = Column(Float, nullable=True)
    aggregate_ton = Column(Float, nullable=True)
    bricks = Column(Float, nullable=True)
    paint_liters = Column(Float, nullable=True)

    # ✅ STATUS & METADATA
    status = Column(String(20), default='completed')
    notes = Column(Text, nullable=True)

    # ✅ TIMESTAMPS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)

    # ✅ RELATIONSHIPS
    user = relationship("User", back_populates="manual_estimations")
    costs = relationship(
        "ManualEstimationCost",
        back_populates="estimation",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "estimation_code": self.estimation_code,
            "estimation_name": self.estimation_name,
            "area_sqft": self.area_sqft,
            "floors": self.floors,
            "mix_type": self.mix_type,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ManualEstimationCost(Base):
    """
    Cost breakdown for manual estimation.
    One row per material type (steel, cement, sand, aggregate, brick, paint).
    """
    __tablename__ = "manual_estimation_costs"

    id = Column(Integer, primary_key=True, index=True)
    estimation_id = Column(Integer, ForeignKey("manual_estimations.id", ondelete="CASCADE"), nullable=False)

    # ✅ MATERIAL IDENTIFICATION
    material_type = Column(String(50), nullable=False)
    cost_category = Column(String(50), nullable=True)

    # ✅ QUANTITY & UNIT
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    rate_per_unit = Column(Float, nullable=False)

    # ✅ CALCULATED COSTS
    material_cost = Column(Float, nullable=False)
    wastage_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)

    # ✅ METADATA
    notes = Column(Text, nullable=True)

    # ✅ TIMESTAMPS
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ✅ RELATIONSHIPS
    estimation = relationship("ManualEstimation", back_populates="costs")

    def to_dict(self):
        return {
            "id": self.id,
            "material_type": self.material_type,
            "quantity": self.quantity,
            "unit": self.unit,
            "rate_per_unit": self.rate_per_unit,
            "material_cost": self.material_cost,
            "wastage_cost": self.wastage_cost,
            "total_cost": self.total_cost,
        }
