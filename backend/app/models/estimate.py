from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, index=True)
    area_sqft = Column(Float, nullable=False)
    floors = Column(Integer, default=1)
    wastage_percent = Column(Float, default=5.0)
    mix_type = Column(String(20), default="M20")
    total_cost = Column(Float, default=0.0)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # ✅ PostgreSQL timezone-aware timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="estimates")