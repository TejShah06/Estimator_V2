"""
Floor plan analysis API route.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
import logging

from app.services.floorplan_service import analyze_floorplan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/floorplan", tags=["Floor Plan Analysis"])


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Upload a floor plan image for AI analysis."""
    allowed = {"image/jpeg", "image/png", "image/jpg", "image/bmp", "image/tiff", "image/webp"}

    if file.content_type not in allowed:
        raise HTTPException(400, f"Invalid type: {file.content_type}")

    try:
        image_bytes = await file.read()

        if len(image_bytes) == 0:
            raise HTTPException(400, "Empty file")
        if len(image_bytes) > 20 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 20MB)")

        logger.info(f"Received: {file.filename} ({len(image_bytes)/1024:.1f}KB)")

        result = analyze_floorplan(image_bytes)
        return JSONResponse(content=result)

    except ValueError as e:
        logger.error(f"Validation: {e}")
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@router.post("/analyze-custom")
async def analyze_custom(
    file: UploadFile = File(...),
    flooring_cost_per_sqft: float = Query(85.0, description="₹/sqft"),
    wall_paint_cost_per_sqft: float = Query(18.0, description="₹/sqft"),
    ceiling_paint_cost_per_sqft: float = Query(14.0, description="₹/sqft"),
    door_unit_cost: float = Query(8500.0, description="₹/door"),
    window_unit_cost: float = Query(6000.0, description="₹/window"),
    wall_height_ft: float = Query(10.0, description="feet"),
    electrical_per_room: float = Query(5500.0, description="₹/room"),
    plumbing_per_wet_room: float = Query(25000.0, description="₹/wet room"),
):
    """Upload floor plan with custom rates (INR)."""
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(400, "Empty file")

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

        result = analyze_floorplan(image_bytes, rates=rates)
        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(500, f"Analysis failed: {str(e)}")