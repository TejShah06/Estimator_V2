# backend/app/api/routes/project.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models.estimate import Estimate
from app.models.floorplan_project import FloorPlanProject
from app.models.user import User
from app.api.deps import get_current_user, get_db

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/recent")
async def get_recent_projects(
    limit: int = Query(default=20, ge=1, le=100),
    source_type: Optional[str] = Query(default=None, description="Filter: 'ai', 'manual', or None for both"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent projects for the current user
    - source_type=None → returns both AI and Manual
    - source_type='ai' → returns only AI projects
    - source_type='manual' → returns only Manual projects
    """
    try:
        projects = []

        # ✅ Fetch Manual Estimates (if not filtered to AI only)
        if source_type is None or source_type == "manual":
            estimates = (
                db.query(Estimate)
                .filter(Estimate.user_id == current_user.id)
                .order_by(Estimate.created_at.desc())
                .limit(limit)
                .all()
            )

            for est in estimates:
                projects.append({
                    "id": f"manual-{est.id}",
                    "project_name": f"Manual Estimate #{est.id}",
                    "source_type": "manual",
                    "estimated_cost": est.total_cost or 0,
                    "created_at": est.created_at.isoformat() if est.created_at else datetime.utcnow().isoformat(),
                    "status": "completed",
                    "rooms_count": 0,
                    "total_area": est.area_sqft or 0,
                    "doors_count": 0,
                    "windows_count": 0,
                    "floors": est.floors or 1,
                    "mix_type": est.mix_type or "M20",
                    "wastage_percent": est.wastage_percent or 0,
                })

        # ✅ Fetch AI FloorPlan Projects (if not filtered to Manual only)
        if source_type is None or source_type == "ai":
            ai_projects = (
                db.query(FloorPlanProject)
                .filter(FloorPlanProject.user_id == current_user.id)
                .order_by(FloorPlanProject.created_at.desc())
                .limit(limit)
                .all()
            )

            for proj in ai_projects:
                projects.append({
                    "id": f"ai-{proj.id}",
                    "project_name": proj.project_name or f"AI Analysis #{proj.id}",
                    "source_type": "ai",
                    "estimated_cost": proj.estimated_cost or 0,
                    "created_at": proj.created_at.isoformat() if proj.created_at else datetime.utcnow().isoformat(),
                    "status": proj.status or "completed",
                    "rooms_count": proj.rooms_count or 0,
                    "total_area": proj.total_area_sqft or 0,
                    "doors_count": proj.doors_count or 0,
                    "windows_count": proj.windows_count or 0,
                    "floors": 1,
                    "preview_path": proj.preview_path,
                    "analysis_time": proj.analysis_time_seconds or 0,
                })

        # ✅ Sort combined list by created_at (newest first)
        projects.sort(key=lambda x: x["created_at"], reverse=True)

        # ✅ Apply final limit
        return projects[:limit]

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching recent projects: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}")
async def get_project_details(
    project_id: str,  # ⚠️ Changed to string to handle "ai-1" or "manual-1"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single project details"""
    try:
        if project_id.startswith("manual-"):
            real_id = int(project_id.split("-")[1])
            
            estimate = (
                db.query(Estimate)
                .filter(
                    Estimate.id == real_id,
                    Estimate.user_id == current_user.id
                )
                .first()
            )
            
            if not estimate:
                raise HTTPException(status_code=404, detail="Project not found")

            return {
                "id": project_id,
                "project_name": f"Manual Estimate #{estimate.id}",
                "source_type": "manual",
                "estimated_cost": estimate.total_cost or 0,
                "created_at": estimate.created_at.isoformat() if estimate.created_at else None,
                "status": "completed",
                "rooms_count": 0,
                "total_area": estimate.area_sqft or 0,
                "doors_count": 0,
                "floors": estimate.floors or 1,
                "wastage_percent": estimate.wastage_percent or 0,
                "mix_type": estimate.mix_type or "M20",
            }

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

            return {
                "id": project_id,
                "project_name": proj.project_name or f"AI Analysis #{proj.id}",
                "source_type": "ai",
                "estimated_cost": proj.estimated_cost or 0,
                "created_at": proj.created_at.isoformat() if proj.created_at else None,
                "status": proj.status or "completed",
                "rooms_count": proj.rooms_count or 0,
                "total_area": proj.total_area_sqft or 0,
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
    """Delete a project"""
    try:
        if project_id.startswith("manual-"):
            real_id = int(project_id.split("-")[1])

            estimate = (
                db.query(Estimate)
                .filter(
                    Estimate.id == real_id,
                    Estimate.user_id == current_user.id
                )
                .first()
            )

            if not estimate:
                raise HTTPException(status_code=404, detail="Project not found")

            db.delete(estimate)

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

            db.delete(proj)

        else:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        db.commit()
        return {"message": "Project deleted successfully", "id": project_id}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))