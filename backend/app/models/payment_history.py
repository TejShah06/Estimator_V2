from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, ForeignKey, func, Text
)
from sqlalchemy.orm import relationship
from app.db.database import Base

class PaymentHistory(Base):
    __tablename__ = "payment_history"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                                  nullable=False)
    subscription_id      = Column(Integer, ForeignKey("user_subscriptions.id"),
                                  nullable=True)

    # Razorpay details
    razorpay_order_id    = Column(String(200), nullable=True)
    razorpay_payment_id  = Column(String(200), nullable=True)
    razorpay_signature   = Column(String(500), nullable=True)

    # Payment info
    amount               = Column(Float, nullable=False)
    currency             = Column(String(10), default="INR")
    billing_cycle        = Column(String(20), nullable=True)  # monthly / yearly
    plan_name            = Column(String(50), nullable=True)

    # Status: created / paid / failed / refunded
    status               = Column(String(30), default="created")
    failure_reason       = Column(Text, nullable=True)

    # Timestamps
    created_at           = Column(DateTime(timezone=True),
                                  server_default=func.now())
    paid_at              = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user                 = relationship("User", back_populates="payments")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "amount": self.amount,
            "currency": self.currency,
            "billing_cycle": self.billing_cycle,
            "plan_name": self.plan_name,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
        }