from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import logging
import shutil
import json
import os
from pathlib import Path


from app.services.generate_3d_service import generate_3d_service
from app.services.floorplan_service import analyze_floorplan
from app.models.floorplan_project import FloorPlanProject
from app.models.floorplan_3dmodel import FloorPlan3DModel
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
    CASE 1: Upload floorplan image → Analyze → Generate 3D model
    """
    try:
        # Read file bytes
        file_bytes = await file.read()
        
        # Save file for reference
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)
        
        logger.info(f"File uploaded: {file.filename}")
        
        # Step 1: Analyze the floorplan
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
        
        # Step 2: Generate 3D model
        result = generate_3d_service(
            floorplan_result=floorplan_result,
            project_id=project_id,
            db=db
        )
        
        logger.info(f"3D model generated for project {project_id}")
        
        return {
            "status": "success",
            "project_id": project_id,
            "message": "Floorplan analyzed and 3D model generated",
            "generation_time_seconds": result.get("generation_time"),
            "model_id": result.get("model_id"),
            "glb_file": result.get("glb_file"),
            "download_url": f"/floorplan-3d/{project_id}/model/download"
        }
    
    except Exception as e:
        logger.error(f"Upload and Generate Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process: {str(e)}")


@router.post("/{project_id}/generate")
def generate_3d_from_existing(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CASE 2: Generate 3D model from existing project ID
    """
    try:
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

        result = generate_3d_service(
            floorplan_result=floorplan_result,
            project_id=project_id,
            db=db
        )

        return {
            "status": "success",
            "project_id": project_id,
            "message": "3D model generated from existing project",
            "generation_time_seconds": result.get("generation_time"),
            "model_id": result.get("model_id"),
            "glb_file": result.get("glb_file"),
            "download_url": f"/floorplan-3d/{project_id}/model/download"
        }
    
    except Exception as e:
        logger.error(f"3D Generation Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"3D Generation failed: {str(e)}")


@router.get("/{project_id}/model")
def get_3d_model(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get 3D model information for a project
    """
    try:
        project = db.query(FloorPlanProject).filter(
            FloorPlanProject.id == project_id,
            FloorPlanProject.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        model = db.query(FloorPlan3DModel).filter(
            FloorPlan3DModel.project_id == project_id
        ).first()

        if not model:
            raise HTTPException(status_code=404, detail="3D model not found")

        return {
            "status": "success",
            "model": {
                "id": model.id,
                "project_id": model.project_id,
                "model_name": model.model_name,
                "glb_file": model.glb_file_path,
                "obj_file": model.obj_file_path,
                "vertices_count": model.vertices_count,
                "faces_count": model.faces_count,
                "generation_method": model.generation_method,
                "processing_status": model.processing_status,
                "generation_time": model.generation_time_seconds,
                "created_at": model.created_at.isoformat() if model.created_at else None,
                "download_url": f"/floorplan-3d/{project_id}/model/download"
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving 3D model: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/model/download")
def download_3d_model(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download 3D model as GLB file
    """
    try:
        project = db.query(FloorPlanProject).filter(
            FloorPlanProject.id == project_id,
            FloorPlanProject.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        model = db.query(FloorPlan3DModel).filter(
            FloorPlan3DModel.project_id == project_id
        ).first()

        if not model or not model.glb_file_path:
            raise HTTPException(status_code=404, detail="3D model file not found")

        file_path = model.glb_file_path
        
        # Handle both absolute and relative paths
        if not os.path.isabs(file_path):
            file_path = os.path.join(os.getcwd(), file_path)
        
        if not os.path.exists(file_path):
            logger.error(f"Model file not found at: {file_path}")
            raise HTTPException(status_code=404, detail="Model file not found on disk")

        logger.info(f"Downloading 3D model: {file_path}")

        return FileResponse(
            path=file_path,
            filename=f"floorplan_project_{project_id}.glb",
            media_type="model/gltf-binary"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading 3D model: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/models")
def list_project_models(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all 3D models for a project (for future multi-model support)
    """
    try:
        project = db.query(FloorPlanProject).filter(
            FloorPlanProject.id == project_id,
            FloorPlanProject.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        models = db.query(FloorPlan3DModel).filter(
            FloorPlan3DModel.project_id == project_id
        ).all()

        return {
            "status": "success",
            "project_id": project_id,
            "models_count": len(models),
            "models": [
                {
                    "id": model.id,
                    "model_name": model.model_name,
                    "glb_file": model.glb_file_path,
                    "generation_method": model.generation_method,
                    "generation_time": model.generation_time_seconds,
                    "created_at": model.created_at.isoformat() if model.created_at else None,
                    "download_url": f"/floorplan-3d/{project_id}/model/download"
                }
                for model in models
            ]
        }
    
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))