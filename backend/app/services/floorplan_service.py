"""
Main Pipeline Orchestrator v4

✅ Fixes:
  - Pass zones to scale calculator
  - Validation logging at every stage
  - No scale_factor correction (geometry done on resized image)
"""

import time
import logging
import cv2
import warnings
from pathlib import Path

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

logger = logging.getLogger(__name__)

PREVIEW_DIR = Path(__file__).resolve().parents[2] / "previews"
PREVIEW_DIR.mkdir(exist_ok=True)


def analyze_floorplan(image_bytes: bytes, rates: dict = None) -> dict:
    t0 = time.time()
    logger.info("=" * 60)
    logger.info("  FLOOR PLAN ANALYSIS PIPELINE START")
    logger.info("=" * 60)

    timings = {}

    # Stage 1
    t = time.time()
    pre = preprocess(image_bytes)
    timings["preprocessing"] = round(time.time() - t, 3)

    # Stage 2
    t = time.time()
    yolo = detect(pre["enhanced"])
    timings["yolo"] = round(time.time() - t, 3)

    # Stage 3
    t = time.time()
    sam = segment_walls(
        image=pre["enhanced"],
        binary=pre["binary"],
        zones=yolo["zones"],
        doors=yolo["doors"],
    )
    timings["segmentation"] = round(time.time() - t, 3)

    # Stage 4
    t = time.time()
    skel = extract_centrelines(sam["wall_mask"])
    timings["skeleton"] = round(time.time() - t, 3)

    # Stage 5
    t = time.time()
    ocr = run_ocr(pre["enhanced"])
    timings["ocr"] = round(time.time() - t, 3)

    # Stage 6 - ✅ Pass zones AND scale_factor
    t = time.time()
    scale = calculate_scale(
        dimensions=ocr["dimensions"],
        segments=skel["segments"],
        image_shape=pre["enhanced"].shape,
        scale_factor=pre["scale_factor"],
        zones=yolo["zones"],
    )
    timings["scale"] = round(time.time() - t, 3)

    # Stage 7
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

    # Stage 8
    t = time.time()
    estimation = estimate(
        rooms=rooms,
        total_doors=len(yolo["doors"]),
        total_windows=len(yolo["windows"]),
        rates=rates,
    )
    timings["estimation"] = round(time.time() - t, 3)

    # Stage 9
    t = time.time()
    preview_img = draw_preview(
        image=pre["enhanced"],
        rooms=rooms,
        doors=yolo["doors"],
        windows=yolo["windows"],
        skeleton=skel["skeleton"],
        ocr_labels=ocr["labels"],
        ocr_dimensions=ocr["dimensions"],
        scale=scale,
    )
    preview_b64 = encode_image(preview_img)
    timings["preview"] = round(time.time() - t, 3)

    preview_path = PREVIEW_DIR / "preview.jpg"
    cv2.imwrite(str(preview_path), preview_img)
    logger.info(f"  Preview saved: {preview_path}")

    total_time = round(time.time() - t0, 3)
    timings["total"] = total_time
    logger.info(f"  PIPELINE COMPLETE ({total_time}s)")
    logger.info("=" * 60)

    # Build response
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

    return {
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
        "preview": preview_b64,
        "preview_url": "/previews/preview.jpg",
        "timings": timings,
    }