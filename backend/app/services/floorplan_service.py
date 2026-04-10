"""
Main Pipeline Orchestrator v4

✅ Fixes:
  - Pass zones to scale calculator
  - Validation logging at every stage
  - No scale_factor correction (geometry done on resized image)
  - Returns project ID for frontend navigation
"""

import time
import logging
import cv2
import warnings
from pathlib import Path
from sqlalchemy.orm import Session

warnings.filterwarnings(
    "ignore", category=UserWarning, module="torch.utils.data.dataloader"
)

from .AiService.preprocessing import preprocess
from .AiService.yolo_detector import detect
from .AiService.sam_segmentor import segment_walls
from .AiService.skeletonizer import extract_centrelines
from .AiService.ocr_engine import run_ocr
from .AiService.scale_calculator import calculate_scale
from .AiService.geometry_engine import compute_geometry
from .AiService.estimation_engine import estimate
from .AiService.preview_generator import draw_preview, encode_image
from .AiService.save_to_db import save_floorplan_to_db

logger = logging.getLogger(__name__)

PREVIEW_DIR = Path(__file__).resolve().parents[2] / "previews"
PREVIEW_DIR.mkdir(exist_ok=True)


def analyze_floorplan(
    image_bytes: bytes, 
    rates: dict = None,
    db: Session = None,
    user_id: int = None,
    project_name: str = None
) -> dict:
    """
    Complete floor plan analysis pipeline.
    
    Args:
        image_bytes: Raw image data
        rates: Optional custom pricing rates
        db: Database session (required to save)
        user_id: User ID (required to save)
        project_name: Optional project name
    
    Returns:
        dict with analysis results including 'id' field if saved to DB
    """
    t0 = time.time()
    logger.info("=" * 60)
    logger.info("  FLOOR PLAN ANALYSIS PIPELINE START")
    logger.info("=" * 60)

    timings = {}

    # ──────────────────────────────────────────────────────────
    # Stage 1: Preprocessing
    # ──────────────────────────────────────────────────────────
    t = time.time()
    pre = preprocess(image_bytes)
    timings["preprocessing"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 1: Preprocessing ({timings['preprocessing']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 2: YOLO Detection
    # ──────────────────────────────────────────────────────────
    t = time.time()
    yolo = detect(pre["enhanced"])
    timings["yolo"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 2: YOLO Detection ({timings['yolo']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 3: SAM Segmentation
    # ──────────────────────────────────────────────────────────
    t = time.time()
    sam = segment_walls(
        image=pre["enhanced"],
        binary=pre["binary"],
        zones=yolo["zones"],
        doors=yolo["doors"],
    )
    timings["segmentation"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 3: Segmentation ({timings['segmentation']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 4: Skeleton Extraction
    # ──────────────────────────────────────────────────────────
    t = time.time()
    skel = extract_centrelines(sam["wall_mask"])
    timings["skeleton"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 4: Skeleton ({timings['skeleton']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 5: OCR
    # ──────────────────────────────────────────────────────────
    t = time.time()
    ocr = run_ocr(pre["enhanced"])
    timings["ocr"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 5: OCR ({timings['ocr']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 6: Scale Calculation
    # ──────────────────────────────────────────────────────────
    t = time.time()
    scale = calculate_scale(
        dimensions=ocr["dimensions"],
        segments=skel["segments"],
        image_shape=pre["enhanced"].shape,
        scale_factor=pre["scale_factor"],
        zones=yolo["zones"],
    )
    timings["scale"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 6: Scale ({timings['scale']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 7: Geometry Computation
    # ──────────────────────────────────────────────────────────
    t = time.time()
    rooms = compute_geometry(
        room_masks=sam["room_masks"],
        scale=scale,
        ocr_labels=ocr["labels"],
        doors=yolo["doors"],
        windows=yolo["windows"],
        wall_thickness_px=skel["wall_thickness_px"],
        image_shape=pre["enhanced"].shape,
    )
    timings["geometry"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 7: Geometry ({timings['geometry']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 8: Cost Estimation
    # ──────────────────────────────────────────────────────────
    t = time.time()
    estimation = estimate(
        rooms=rooms,
        total_doors=len(yolo["doors"]),
        total_windows=len(yolo["windows"]),
        rates=rates,
    )
    timings["estimation"] = round(time.time() - t, 3)
    logger.info(f"✅ Stage 8: Estimation ({timings['estimation']}s)")

    # ──────────────────────────────────────────────────────────
    # Stage 9: Preview Generation
    # # ──────────────────────────────────────────────────────────
    # t = time.time()
    # preview_img = draw_preview(
    #     image=pre["enhanced"],
    #     rooms=rooms,
    #     doors=yolo["doors"],
    #     windows=yolo["windows"],
    #     skeleton=skel["skeleton"],
    #     ocr_labels=ocr["labels"],
    #     ocr_dimensions=ocr["dimensions"],
    #     scale=scale,
    # )
    # preview_b64 = encode_image(preview_img)
    # timings["preview"] = round(time.time() - t, 3)

    # preview_path = PREVIEW_DIR / "preview.jpg"
    # cv2.imwrite(str(preview_path), preview_img)
    # logger.info(f"✅ Stage 9: Preview saved ({timings['preview']}s) → {preview_path}")

    # ──────────────────────────────────────────────────────────
    # Build Serializable Response
    # ──────────────────────────────────────────────────────────
    serialisable_rooms = []
    for rm in rooms:
        serialisable_rooms.append({
            "room_id": int(rm["room_id"]),
            "label": str(rm["label"]),
            "area_sqft": float(rm["area_sqft"]),
            "area_m2": float(rm["area_m2"]),
            "perimeter_ft": float(rm["perimeter_ft"]),
            "perimeter_m": float(rm["perimeter_m"]),
            "wall_length_ft": float(rm.get("wall_length_ft", rm["perimeter_ft"])),
            "wall_length_m": float(rm.get("wall_length_m", rm["perimeter_m"])),
            "wall_thickness_ft": float(rm.get("wall_thickness_ft", 0)),
            "wall_thickness_m": float(rm.get("wall_thickness_m", 0)),
            "doors": int(rm["doors"]),
            "windows": int(rm["windows"]),
            "centroid": [int(rm["centroid"][0]), int(rm["centroid"][1])],
            "bbox": [int(rm["bbox"][0]), int(rm["bbox"][1]),
                     int(rm["bbox"][2]), int(rm["bbox"][3])],
        })

    result = {
        "rooms": serialisable_rooms,
        "rooms_count": int(len(rooms)),
        "doors_count": int(len(yolo["doors"])),
        "windows_count": int(len(yolo["windows"])),
        "scale": {
            "px_per_foot": float(scale["px_per_foot"]),
            "foot_per_px": float(scale["foot_per_px"]),
            "px_per_meter": float(scale["px_per_meter"]),
            "meter_per_px": float(scale["meter_per_px"]),
            "method": str(scale["method"]),
            "samples": int(scale["samples"]),
        },
        "estimation": estimation,
        "wall_segments": int(len(skel["segments"])),
        "wall_thickness_px": float(skel["wall_thickness_px"]),
        "ocr_labels_count": int(len(ocr["labels"])),
        "ocr_dimensions_count": int(len(ocr["dimensions"])),
        #"preview": preview_b64,
        #"preview_url": "/previews/preview.jpg",
        "timings": timings,
    }

    # ──────────────────────────────────────────────────────────
    # Stage 10: Save to Database (CRITICAL FOR FRONTEND)
    # ──────────────────────────────────────────────────────────
    if db is not None and user_id is not None:
        t = time.time()
        try:
            name = project_name or "Untitled Project"

            saved_project = save_floorplan_to_db(
                db=db,
                user_id=user_id,
                result=result,
                project_name=name,
            )

            # ✅ CRITICAL: Add project ID to response
            result["id"] = saved_project.id  # <-- Frontend needs this!
            result["project_id"] = saved_project.id  # Also include for clarity
            result["saved"] = True
            
            logger.info(f"✅ Stage 10: Saved to DB (ID: {saved_project.id})")

        except Exception as e:
            logger.error(f"❌ Stage 10 failed: {e}", exc_info=True)
            result["id"] = None
            result["project_id"] = None
            result["saved"] = False

        timings["save_to_db"] = round(time.time() - t, 3)
    else:
        logger.warning("⚠️ Stage 9 skipped: no db session or user_id provided")
        result["id"] = None
        result["project_id"] = None
        result["saved"] = False

    # ──────────────────────────────────────────────────────────
    # Final Timing
    # ──────────────────────────────────────────────────────────
    total_with_save = round(time.time() - t0, 3)
    timings["total"] = total_with_save

    logger.info("=" * 60)
    logger.info(f"  PIPELINE COMPLETE ({total_with_save}s)")
    logger.info(f"  Project ID: {result.get('id', 'NOT SAVED')}")
    logger.info("=" * 60)

    return result