from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, Float, func
)
from sqlalchemy.orm import relationship
from app.db.database import Base

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                             nullable=False)
    plan_id         = Column(Integer, ForeignKey("subscription_plans.id"),
                             nullable=False)

    # Billing cycle
    billing_cycle   = Column(String(20), default="monthly")  # monthly / yearly

    # Status
    status          = Column(String(20), default="active")
    # active / trial / expired / cancelled

    # Trial
    is_trial        = Column(Boolean, default=False)
    trial_ends_at   = Column(DateTime(timezone=True), nullable=True)

    # Subscription period
    starts_at       = Column(DateTime(timezone=True),
                             server_default=func.now())
    ends_at         = Column(DateTime(timezone=True), nullable=True)

    # Razorpay
    razorpay_subscription_id = Column(String(200), nullable=True)
    razorpay_order_id        = Column(String(200), nullable=True)

    # Timestamps
    created_at      = Column(DateTime(timezone=True),
                             server_default=func.now())
    updated_at      = Column(DateTime(timezone=True),
                             server_default=func.now(),
                             onupdate=func.now())

    # Relationships
    plan            = relationship("SubscriptionPlan", back_populates="subscriptions")
    user            = relationship("User", back_populates="subscription")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "plan_id": self.plan_id,
            "plan_name": self.plan.name if self.plan else None,
            "display_name": self.plan.display_name if self.plan else None,
            "billing_cycle": self.billing_cycle,
            "status": self.status,
            "is_trial": self.is_trial,
            "trial_ends_at": self.trial_ends_at.isoformat()
                             if self.trial_ends_at else None,
            "starts_at": self.starts_at.isoformat()
                         if self.starts_at else None,
            "ends_at": self.ends_at.isoformat()
                       if self.ends_at else None,
        }