from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session


from app.models.estimate import Estimate
from app.models.user import User
from app.api.deps import get_current_user, get_db

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/recent")
def get_recent_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    projects = db.query(Estimate).filter(
        Estimate.user_id == current_user.id
    ).order_by(
        Estimate.created_at.desc()
    ).limit(5).all()

    result = []

    for p in projects:
        result.append({
            "area_sqft": p.area_sqft,
            "floors": p.floors,
            "total_cost": p.total_cost,
            "created_at": p.created_at
        })

    return result