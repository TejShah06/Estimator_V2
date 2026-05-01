from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.models.manual_estimation import ManualEstimation
from app.models.floorplan_project import FloorPlanProject
from app.models.user import User
from app.api.deps import get_current_user, get_db

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/recent")
async def get_recent_projects(
    limit: int = Query(default=20, ge=1, le=100),
    source_type: Optional[str] = Query(default=None, description="'ai', 'manual', or None for both"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent projects for current user"""
    try:
        projects = []

        # Manual Estimations
        if source_type is None or source_type == "manual":
            estimations = (
                db.query(ManualEstimation)
                .filter(
                    ManualEstimation.user_id == current_user.id,
                    ManualEstimation.is_deleted == False
                )
                .order_by(ManualEstimation.created_at.desc())
                .limit(limit)
                .all()
            )

            for est in estimations:
                total_cost = sum(c.total_cost for c in est.costs) if est.costs else 0.0
                
                projects.append({
                    "id": f"manual-{est.id}",
                    "project_name": est.estimation_name,
                    "estimation_code": est.estimation_code,
                    "source_type": "manual",
                    "estimated_cost": float(total_cost),
                    "created_at": est.created_at.isoformat() if est.created_at else None,
                    "status": est.status,
                    "rooms_count": 0,
                    "total_area": float(est.area_sqft) if est.area_sqft else 0.0,
                    "doors_count": 0,
                    "windows_count": 0,
                    "floors": est.floors or 1,
                    "mix_type": est.mix_type,
                    "area_sqft": float(est.area_sqft) if est.area_sqft else 0.0,
                })

        # AI Projects
        if source_type is None or source_type == "ai":
            ai_projects = (
                db.query(FloorPlanProject)
                .filter(
                    FloorPlanProject.user_id == current_user.id,
                    FloorPlanProject.is_deleted == False
                )
                .order_by(FloorPlanProject.created_at.desc())
                .limit(limit)
                .all()
            )

            for proj in ai_projects:
                projects.append({
                    "id": f"ai-{proj.id}",
                    "project_name": proj.project_name or f"AI Analysis #{proj.id}",
                    "project_code": proj.project_code,
                    "source_type": "ai",
                    "estimated_cost": float(proj.estimated_cost) if proj.estimated_cost else 0.0,
                    "created_at": proj.created_at.isoformat() if proj.created_at else None,
                    "status": proj.status or "completed",
                    "rooms_count": proj.rooms_count or 0,
                    "total_area": float(proj.total_area_sqft) if proj.total_area_sqft else 0.0,
                    "doors_count": proj.doors_count or 0,
                    "windows_count": proj.windows_count or 0,
                    "preview_path": proj.preview_path,
                    "analysis_time": proj.analysis_time_seconds or 0,
                })

        # Sort combined by created_at
        projects.sort(key=lambda x: x["created_at"] or "", reverse=True)
        return projects[:limit]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching recent projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}")
async def get_project_details(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single project details"""
    try:
        if project_id.startswith("manual-"):
            real_id = int(project_id.split("-")[1])
            
            estimation = (
                db.query(ManualEstimation)
                .filter(
                    ManualEstimation.id == real_id,
                    ManualEstimation.user_id == current_user.id,
                    ManualEstimation.is_deleted == False
                )
                .first()
            )
            
            if not estimation:
                raise HTTPException(status_code=404, detail="Project not found")

            total_cost = sum(c.total_cost for c in estimation.costs) if estimation.costs else 0.0

            return {
                "id": project_id,
                "project_name": estimation.estimation_name,
                "estimation_code": estimation.estimation_code,
                "source_type": "manual",
                "estimated_cost": float(total_cost),
                "created_at": estimation.created_at.isoformat() if estimation.created_at else None,
                "status": estimation.status,
                "rooms_count": 0,
                "total_area": float(estimation.area_sqft) if estimation.area_sqft else 0.0,
                "doors_count": 0,
                "floors": estimation.floors or 1,
                "wastage_percent": estimation.wastage_percent,
                "mix_type": estimation.mix_type,
                "costs": [c.to_dict() for c in estimation.costs] if estimation.costs else [],
            }

        elif project_id.startswith("ai-"):
            real_id = int(project_id.split("-")[1])
            
            proj = (
                db.query(FloorPlanProject)
                .filter(
                    FloorPlanProject.id == real_id,
                    FloorPlanProject.user_id == current_user.id,
                    FloorPlanProject.is_deleted == False
                )
                .first()
            )
            
            if not proj:
                raise HTTPException(status_code=404, detail="Project not found")

            return {
                "id": project_id,
                "project_name": proj.project_name or f"AI Analysis #{proj.id}",
                "project_code": proj.project_code,
                "source_type": "ai",
                "estimated_cost": float(proj.estimated_cost) if proj.estimated_cost else 0.0,
                "created_at": proj.created_at.isoformat() if proj.created_at else None,
                "status": proj.status or "completed",
                "rooms_count": proj.rooms_count or 0,
                "total_area": float(proj.total_area_sqft) if proj.total_area_sqft else 0.0,
                "doors_count": proj.doors_count or 0,
                "windows_count": proj.windows_count or 0,
                "preview_path": proj.preview_path,
            }

        else:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching project details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project (soft delete)"""
    try:
        if project_id.startswith("manual-"):
            real_id = int(project_id.split("-")[1])

            estimation = (
                db.query(ManualEstimation)
                .filter(
                    ManualEstimation.id == real_id,
                    ManualEstimation.user_id == current_user.id
                )
                .first()
            )

            if not estimation:
                raise HTTPException(status_code=404, detail="Project not found")

            estimation.is_deleted = True

        elif project_id.startswith("ai-"):
            real_id = int(project_id.split("-")[1])

            proj = (
                db.query(FloorPlanProject)
                .filter(
                    FloorPlanProject.id == real_id,
                    FloorPlanProject.user_id == current_user.id
                )
                .first()
            )

            if not proj:
                raise HTTPException(status_code=404, detail="Project not found")

            proj.is_deleted = True

        else:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        db.commit()
        return {"message": "Project deleted successfully", "id": project_id}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f" Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))