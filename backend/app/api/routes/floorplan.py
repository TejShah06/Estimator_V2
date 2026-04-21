from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.floorplan_service import analyze_floorplan
from app.models.floorplan_project import FloorPlanProject

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/floorplan", tags=["Floor Plan Analysis"])


@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    project_name: Optional[str] = Query(None, description="Custom project name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and analyze a floor plan"""
    allowed = {
        "image/jpeg", "image/png", "image/jpg",
        "image/bmp", "image/tiff", "image/webp",
    }

    if file.content_type not in allowed:
        raise HTTPException(400, f"Invalid file type: {file.content_type}")

    try:
        image_bytes = await file.read()

        if len(image_bytes) == 0:
            raise HTTPException(400, "Empty file")
        if len(image_bytes) > 20 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 20MB)")

        final_project_name = project_name if project_name and project_name.strip() else None
        
        if not final_project_name and file.filename:
            final_project_name = file.filename.rsplit(".", 1)[0]
        
        if not final_project_name:
            final_project_name = "Untitled"

        logger.info(f"Analyzing: {file.filename} ('{final_project_name}') for user {current_user.id}")

        result = analyze_floorplan(
            image_bytes=image_bytes,
            rates=None,
            db=db,
            user_id=current_user.id,
            project_name=final_project_name,
        )

        return JSONResponse(content=result)

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@router.post("/analyze-custom")
async def analyze_custom(
    file: UploadFile = File(...),
    project_name: Optional[str] = Query(None),
    flooring_cost_per_sqft: float = Query(85.0),
    wall_paint_cost_per_sqft: float = Query(18.0),
    ceiling_paint_cost_per_sqft: float = Query(14.0),
    door_unit_cost: float = Query(8500.0),
    window_unit_cost: float = Query(6000.0),
    wall_height_ft: float = Query(10.0),
    electrical_per_room: float = Query(5500.0),
    plumbing_per_wet_room: float = Query(25000.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze with custom rates"""
    
    allowed = {
        "image/jpeg", "image/png", "image/jpg",
        "image/bmp", "image/tiff", "image/webp",
    }

    if file.content_type not in allowed:
        raise HTTPException(400, f"Invalid file type: {file.content_type}")
    
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(400, "Empty file")
        
        if len(image_bytes) > 20 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 20MB)")

        rates = {
            "flooring_cost_per_sqft": flooring_cost_per_sqft,
            "wall_paint_cost_per_sqft": wall_paint_cost_per_sqft,
            "ceiling_paint_cost_per_sqft": ceiling_paint_cost_per_sqft,
            "door_unit_cost": door_unit_cost,
            "window_unit_cost": window_unit_cost,
            "wall_height_ft": wall_height_ft,
            "electrical_per_room": electrical_per_room,
            "plumbing_per_wet_room": plumbing_per_wet_room,
        }

        final_project_name = project_name if project_name and project_name.strip() else None
        
        if not final_project_name and file.filename:
            final_project_name = file.filename.rsplit(".", 1)[0]
        
        if not final_project_name:
            final_project_name = "Untitled"

        logger.info(f"Analyzing with custom rates: {file.filename} for user {current_user.id}")

        result = analyze_floorplan(
            image_bytes=image_bytes,
            rates=rates,
            db=db,
            user_id=current_user.id,
            project_name=final_project_name,
        )

        return JSONResponse(content=result)

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@router.get("/report/{project_id}")
async def get_analysis_report(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed analysis report"""
    try:
        project = (
            db.query(FloorPlanProject)
            .filter(
                FloorPlanProject.id == project_id,
                FloorPlanProject.user_id == current_user.id
            )
            .first()
        )
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        import json
        rooms = []
        if project.rooms_json:
            try:
                rooms = json.loads(project.rooms_json)
            except:
                rooms = []

        cost_breakdown = {
            "flooring": project.flooring_cost or 0,
            "painting": project.painting_cost or 0,
            "ceiling": project.ceiling_cost or 0,
            "electrical": project.electrical_cost or 0,
            "plumbing": project.plumbing_cost or 0,
            "doors": project.doors_cost or 0,
            "windows": project.windows_cost or 0,
        }

        return {
            "id": project.id,
            "project_name": project.project_name or f"Analysis #{project.id}",
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "status": project.status or "completed",
            "total_area_sqft": project.total_area_sqft or 0,
            "total_area_m2": project.total_area_m2 or 0,
            "rooms_count": project.rooms_count or 0,
            "doors_count": project.doors_count or 0,
            "windows_count": project.windows_count or 0,
            "rooms": rooms,
            "total_cost": project.estimated_cost or 0,
            "cost_breakdown": cost_breakdown,
            "preview_path": project.preview_path,
            "scale_method": project.scale_method or "auto",
            "scale_px_per_foot": project.scale_px_per_foot or 0,
            "analysis_time": project.analysis_time_seconds or 0,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))