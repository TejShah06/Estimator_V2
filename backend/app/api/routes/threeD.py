from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import logging
import io
from pathlib import Path

from app.services.generate_3d_service import generate_3d_service_memory
from app.services.floorplan_service import analyze_floorplan
from app.models.floorplan_project import FloorPlanProject
from app.api.deps import get_current_user, get_db
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/floorplan-3d",
    tags=["3D Models"]
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload-and-generate")
async def upload_and_generate_3d(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload floorplan → Analyze → Generate 3D → Return GLB binary directly
    NO DATABASE SAVE FOR MODEL, NO DISK STORAGE
    """
    try:
        logger.info(f"User {current_user.id} uploading floorplan: {file.filename}")
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Save file temporarily for analysis
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)
        
        logger.info(f"File saved temporarily: {file.filename}")
        
        # ===== STEP 1: Analyze Floorplan =====
        logger.info("Starting AI analysis...")
        analysis_result = analyze_floorplan(
            image_bytes=file_bytes,
            db=db,
            user_id=current_user.id
        )
        
        # Extract project data
        if isinstance(analysis_result, dict):
            project_id = analysis_result.get("project_id")
            floorplan_result = analysis_result
        else:
            project_id = analysis_result.id
            floorplan_result = {
                "project_id": analysis_result.id,
                "project_name": analysis_result.project_name,
                "rooms_json": analysis_result.rooms_json,
                "openings_json": analysis_result.openings_json,
                "walls_json": analysis_result.walls_json,
                "total_area_sqft": analysis_result.total_area_sqft,
                "rooms_count": analysis_result.rooms_count,
                "doors_count": analysis_result.doors_count,
                "windows_count": analysis_result.windows_count,
                "walls_count": analysis_result.walls_count,
                "total_floors": analysis_result.total_floors,
            }
        
        logger.info(f"Floorplan analyzed. Project ID: {project_id}")
        
        # ===== STEP 2: Generate 3D Model in Memory =====
        logger.info("Starting 3D generation (memory mode)...")
        result = generate_3d_service_memory(
            floorplan_result=floorplan_result,
            project_id=project_id
        )
        
        glb_bytes = result["glb_bytes"]
        
        logger.info(f"3D model generated: {len(glb_bytes)} bytes")
        
        # ===== STEP 3: Return GLB Binary Directly =====
        return StreamingResponse(
            io.BytesIO(glb_bytes),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="floorplan_{project_id}.glb"',
                "X-Project-ID": str(project_id),
                "X-Generation-Time": str(result["generation_time"]),
                "X-File-Size": str(result["file_size"]),
                "X-Wall-Count": str(result["wall_count"]),
                "X-Door-Count": str(result["door_count"]),
                "X-Window-Count": str(result["window_count"]),
                "Access-Control-Expose-Headers": "X-Project-ID,X-Generation-Time,X-File-Size,X-Wall-Count,X-Door-Count,X-Window-Count"
            }
        )
    
    except Exception as e:
        logger.error(f"Upload and Generate Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process: {str(e)}")
    
    finally:
        # Clean up uploaded file
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"Cleaned up uploaded file: {file.filename}")
            except Exception as e:
                logger.warning(f"Failed to cleanup upload: {e}")


@router.post("/{project_id}/regenerate")
async def regenerate_3d_from_existing(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Regenerate 3D from existing analyzed project (memory mode)
    """
    try:
        logger.info(f"Regenerating 3D for project {project_id}")
        
        # Verify ownership
        project = db.query(FloorPlanProject).filter(
            FloorPlanProject.id == project_id,
            FloorPlanProject.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        floorplan_result = {
            "project_id": project.id,
            "project_name": project.project_name,
            "rooms_json": project.rooms_json,
            "openings_json": project.openings_json,
            "walls_json": project.walls_json,
            "total_area_sqft": project.total_area_sqft,
            "rooms_count": project.rooms_count,
            "doors_count": project.doors_count,
            "windows_count": project.windows_count,
            "walls_count": project.walls_count,
            "total_floors": project.total_floors,
        }

        # Generate in memory
        result = generate_3d_service_memory(
            floorplan_result=floorplan_result,
            project_id=project_id
        )
        
        glb_bytes = result["glb_bytes"]
        
        logger.info(f"3D model regenerated: {len(glb_bytes)} bytes")

        return StreamingResponse(
            io.BytesIO(glb_bytes),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="floorplan_{project_id}.glb"',
                "X-Project-ID": str(project_id),
                "X-Generation-Time": str(result["generation_time"]),
                "X-File-Size": str(result["file_size"]),
                "Access-Control-Expose-Headers": "X-Project-ID,X-Generation-Time,X-File-Size"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regenerate Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to regenerate: {str(e)}")