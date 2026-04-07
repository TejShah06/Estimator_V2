from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.estimate import Estimate
from app.models.floorplan_project import FloorPlanProject
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    manual_count = db.query(Estimate).filter(
        Estimate.user_id == user_id
    ).count()

    manual_cost = db.query(
        func.coalesce(func.sum(Estimate.total_cost), 0)
    ).filter(Estimate.user_id == user_id).scalar()

    ai_count = db.query(FloorPlanProject).filter(
        FloorPlanProject.user_id == user_id
    ).count()

    ai_cost = db.query(
        func.coalesce(func.sum(FloorPlanProject.estimated_cost), 0)
    ).filter(FloorPlanProject.user_id == user_id).scalar()

    ai_area = db.query(
        func.coalesce(func.sum(FloorPlanProject.total_area_sqft), 0)
    ).filter(FloorPlanProject.user_id == user_id).scalar()

    ai_rooms = db.query(
        func.coalesce(func.sum(FloorPlanProject.rooms_count), 0)
    ).filter(FloorPlanProject.user_id == user_id).scalar()

    stats = {
        "total_projects": manual_count + ai_count,
        "ai_projects": ai_count,
        "manual_projects": manual_count,
        "total_cost": float(manual_cost or 0) + float(ai_cost or 0),
        "total_area_sqft": float(ai_area or 0),
        "total_rooms": int(ai_rooms or 0),
    }

    return stats


@router.get("/recent")
def get_recent_projects(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    combined = []

    # ── Manual estimates ──
    try:
        manual_list = db.query(Estimate).filter(
            Estimate.user_id == user_id
        ).order_by(Estimate.created_at.desc()).limit(limit).all()

        for m in manual_list:
            area = float(m.area_sqft) if m.area_sqft else 0.0
            floors = int(m.floors) if m.floors else 1
            mix = m.mix_type or "M20"

            name = f"{int(area)} sqft"
            if floors > 1:
                name += f" × {floors} floors"
            name += f" ({mix})"

            combined.append({
                "id": f"manual_{m.id}",
                "project_id": m.id,
                "project_name": name,
                "source_type": "manual",
                "estimated_cost": float(m.total_cost) if m.total_cost else 0.0,
                "rooms_count": 0,
                "doors_count": 0,
                "windows_count": 0,
                "total_area": area,
                "status": "completed",
                "created_at": m.created_at.isoformat() if m.created_at else None,
            })
    except Exception as e:
        logger.error(f"Manual fetch error: {e}")

    # ── AI projects ──
    try:
        ai_list = db.query(FloorPlanProject).filter(
            FloorPlanProject.user_id == user_id
        ).order_by(FloorPlanProject.created_at.desc()).limit(limit).all()

        for a in ai_list:
            combined.append({
                "id": f"ai_{a.id}",
                "project_id": a.id,
                "project_name": a.project_name or f"AI Project #{a.id}",
                "source_type": "ai",
                "estimated_cost": float(a.estimated_cost) if a.estimated_cost else 0.0,
                "rooms_count": a.rooms_count or 0,
                "doors_count": a.doors_count or 0,
                "windows_count": a.windows_count or 0,
                "total_area": float(a.total_area_sqft) if a.total_area_sqft else 0.0,
                "status": a.status or "completed",
                "created_at": a.created_at.isoformat() if a.created_at else None,
            })
    except Exception as e:
        logger.error(f"AI fetch error: {e}")

    combined.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return combined[:limit]