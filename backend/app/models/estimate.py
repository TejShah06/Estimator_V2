from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, index=True)

    area_sqft = Column(Float)
    floors = Column(Integer)
    wastage_percent = Column(Float)

    mix_type = Column(String, default="M20")
    total_cost = Column(Float)

    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")