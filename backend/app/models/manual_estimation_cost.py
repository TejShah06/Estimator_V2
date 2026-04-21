
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Text, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class ManualEstimationCost(Base):
    """
    Cost breakdown for manual estimation.
    One row per material type (steel, cement, sand, aggregate, brick, paint).
    """
    __tablename__ = "manual_estimation_costs"

    id = Column(Integer, primary_key=True, index=True)
    estimation_id = Column(Integer, ForeignKey("manual_estimations.id", ondelete="CASCADE"), nullable=False)

    # MATERIAL IDENTIFICATION
    material_type = Column(String(50), nullable=False)  # steel, cement, sand, aggregate, brick, paint
    cost_category = Column(String(50), nullable=True)  # structural, finishing, etc

    # QUANTITY & UNIT
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # kg, bags, ton, unit, liters
    rate_per_unit = Column(Float, nullable=False)

    # CALCULATED COSTS
    material_cost = Column(Float, nullable=False)
    wastage_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)

    # METADATA
    notes = Column(Text, nullable=True)

    # TIMESTAMPS
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # RELATIONSHIPS
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