from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class AdminActivityLog(Base):
    __tablename__ = "admin_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)   # 'user', 'project', 'settings'
    target_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    performed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    admin = relationship("User", foreign_keys=[admin_id])

    def to_dict(self):
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "description": self.description,
            "performed_at": self.performed_at.isoformat() if self.performed_at else None
        }