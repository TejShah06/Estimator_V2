from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.estimate import Estimate
from app.models.user import User
from app.api.deps import get_current_user, get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    total_projects = db.query(Estimate).filter(
        Estimate.user_id == current_user.id
    ).count()

    total_cost = db.query(
        func.sum(Estimate.total_cost)
    ).filter(
        Estimate.user_id == current_user.id
    ).scalar() or 0

    total_area = db.query(
        func.sum(Estimate.area_sqft)
    ).filter(
        Estimate.user_id == current_user.id
    ).scalar() or 0

    return {
        "total_projects": total_projects,
        "total_cost": total_cost,
        "total_area": total_area
    }