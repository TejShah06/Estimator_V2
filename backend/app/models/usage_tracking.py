from sqlalchemy import (
    Column, Integer, String,
    DateTime, ForeignKey, func
)
from sqlalchemy.orm import relationship
from app.db.database import Base

class UsageTracking(Base):
    __tablename__ = "usage_tracking"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                          nullable=False)

    # Type: ai_analysis / three_d / manual
    usage_type   = Column(String(50), nullable=False)

    # Rolling 30-day window anchor
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end   = Column(DateTime(timezone=True), nullable=False)

    # Count
    count        = Column(Integer, default=0)

    # Timestamps
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True),
                          server_default=func.now(),
                          onupdate=func.now())

    # Relationship
    user         = relationship("User", back_populates="usage_records")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "usage_type": self.usage_type,
            "count": self.count,
            "period_start": self.period_start.isoformat()
                            if self.period_start else None,
            "period_end": self.period_end.isoformat()
                          if self.period_end else None,
        }