from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.manual_estimation import ManualEstimation, ManualEstimationCost
from app.models.floorplan_project import FloorPlanProject

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics for current user"""
    user_id = current_user.id

    # MANUAL ESTIMATIONS
    manual_count = db.query(ManualEstimation).filter(
        ManualEstimation.user_id == user_id,
        ManualEstimation.is_deleted == False
    ).count()

    # Calculate manual cost from costs table
    manual_estimations = db.query(ManualEstimation).filter(
        ManualEstimation.user_id == user_id,
        ManualEstimation.is_deleted == False
    ).all()
    
    manual_cost = sum(
        sum(c.total_cost for c in est.costs) if est.costs else 0.0
        for est in manual_estimations
    )

    # AI PROJECTS
    ai_count = db.query(FloorPlanProject).filter(
        FloorPlanProject.user_id == user_id,
        FloorPlanProject.is_deleted == False
    ).count()

    ai_cost = db.query(
        func.coalesce(func.sum(FloorPlanProject.estimated_cost), 0)
    ).filter(
        FloorPlanProject.user_id == user_id,
        FloorPlanProject.is_deleted == False
    ).scalar()

    ai_area = db.query(
        func.coalesce(func.sum(FloorPlanProject.total_area_sqft), 0)
    ).filter(
        FloorPlanProject.user_id == user_id,
        FloorPlanProject.is_deleted == False
    ).scalar()

    ai_rooms = db.query(
        func.coalesce(func.sum(FloorPlanProject.rooms_count), 0)
    ).filter(
        FloorPlanProject.user_id == user_id,
        FloorPlanProject.is_deleted == False
    ).scalar()

    return {
        "total_projects": manual_count + ai_count,
        "ai_projects": ai_count,
        "manual_projects": manual_count,
        "total_cost": float(manual_cost or 0) + float(ai_cost or 0),
        "manual_cost": float(manual_cost or 0),
        "ai_cost": float(ai_cost or 0),
        "total_area_sqft": float(ai_area or 0),
        "total_rooms": int(ai_rooms or 0),
    }


@router.get("/recent")
def get_recent_projects(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent manual and AI projects combined"""
    user_id = current_user.id
    combined = []

    # MANUAL ESTIMATIONS
    try:
        manual_list = db.query(ManualEstimation).filter(
            ManualEstimation.user_id == user_id,
            ManualEstimation.is_deleted == False
        ).order_by(ManualEstimation.created_at.desc()).limit(limit).all()

        for m in manual_list:
            total_cost = sum(c.total_cost for c in m.costs) if m.costs else 0.0
            
            combined.append({
                "id": f"manual_{m.id}",
                "project_id": m.id,
                "project_name": m.estimation_name,
                "description": m.description,
                "source_type": "manual",
                "estimated_cost": float(total_cost),
                "rooms_count": 0,
                "doors_count": 0,
                "windows_count": 0,
                "total_area": float(m.area_sqft) if m.area_sqft else 0.0,
                "status": m.status,
                "mix_type": m.mix_type,
                "floors": m.floors,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            })
    except Exception as e:
        logger.error(f"Manual fetch error: {e}")

    # AI PROJECTS
    try:
        ai_list = db.query(FloorPlanProject).filter(
            FloorPlanProject.user_id == user_id,
            FloorPlanProject.is_deleted == False
        ).order_by(FloorPlanProject.created_at.desc()).limit(limit).all()

        for a in ai_list:
            combined.append({
                "id": f"ai_{a.id}",
                "project_id": a.id,
                "project_name": a.project_name or f"AI Project #{a.id}",
                "description": a.description,
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

    # Sort by created_at
    combined.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return combined[:limit]