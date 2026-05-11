from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)

    # Pricing
    monthly_price = Column(Float, default=0.0)
    yearly_price  = Column(Float, default=0.0)

    # Limits (-1 = unlimited)
    ai_analyses_limit = Column(Integer, default=5)
    three_d_limit     = Column(Integer, default=3)
    manual_limit      = Column(Integer, default=-1)

    # Download permissions
    can_download_ai_pdf     = Column(Boolean, default=False)  # AI → PDF
    can_download_manual_pdf = Column(Boolean, default=True)   # Manual → PDF
    can_download_3d_glb     = Column(Boolean, default=False)  # 3D → GLB 

    # Plan status
    is_active   = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

    # Relationships
    subscriptions = relationship("UserSubscription", back_populates="plan")

    def to_dict(self):
        return {
            "id":           self.id,
            "name":         self.name,
            "display_name": self.display_name,
            "monthly_price": self.monthly_price,
            "yearly_price":  self.yearly_price,
            "ai_analyses_limit": self.ai_analyses_limit,
            "three_d_limit":     self.three_d_limit,
            "manual_limit":      self.manual_limit,
            "can_download_ai_pdf":     self.can_download_ai_pdf,
            "can_download_manual_pdf": self.can_download_manual_pdf,
            "can_download_3d_glb":     self.can_download_3d_glb,  # ← renamed
            "description": self.description,
        }