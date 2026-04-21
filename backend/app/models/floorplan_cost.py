from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Boolean, Text, Date, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class FloorPlanCost(Base):
    __tablename__ = "floorplan_costs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("floorplan_projects.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("floorplan_rooms.id", ondelete="CASCADE"), nullable=True)

    # Cost identification
    cost_item_code = Column(String(50), nullable=True)

    # Cost category
    category = Column(String(50), nullable=False)
    subcategory = Column(String(50), nullable=True)
    item_description = Column(Text, nullable=True)

    # Quantity
    quantity = Column(Float, nullable=False, default=0)
    unit = Column(String(20), nullable=False, default='sqft')

    # Pricing breakdown
    rate_per_unit = Column(Float, nullable=False, default=0)
    material_cost = Column(Float, default=0)
    labor_cost = Column(Float, default=0)
    equipment_cost = Column(Float, default=0)
    overhead_cost = Column(Float, default=0)
    total_cost = Column(Float, nullable=False, default=0)

    # Tax and markup
    tax_percentage = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    markup_percentage = Column(Float, default=0)
    markup_amount = Column(Float, default=0)
    grand_total = Column(Float, nullable=True)

    # Cost level
    applies_to = Column(String(20), default='project')

    # Additional references
    opening_id = Column(Integer, ForeignKey("floorplan_openings.id", ondelete="CASCADE"), nullable=True)
    wall_id = Column(Integer, ForeignKey("floorplan_walls.id", ondelete="CASCADE"), nullable=True)

    # Supplier information
    supplier_name = Column(String(100), nullable=True)
    supplier_contact = Column(String(100), nullable=True)
    quote_reference = Column(String(100), nullable=True)
    quote_date = Column(Date, nullable=True)
    quote_valid_until = Column(Date, nullable=True)

    # Status
    is_estimate = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("FloorPlanProject", back_populates="costs")
    
    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "subcategory": self.subcategory,
            "quantity": self.quantity,
            "unit": self.unit,
            "rate_per_unit": self.rate_per_unit,
            "total_cost": self.total_cost,
            "grand_total": self.grand_total or self.total_cost,
        }