"""
Stage 2: YOLO Detection - doors, windows, zones
"""

import logging
import numpy as np
from pathlib import Path
from ultralytics import YOLO

logger = logging.getLogger(__name__)

_APP_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = _APP_DIR / "modelML" / "best.pt"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"YOLO model not found at: {MODEL_PATH}\n"
        f"Searched from: {Path(__file__).resolve()}"
    )

_model = YOLO(str(MODEL_PATH))
logger.info(f"YOLO model loaded from {MODEL_PATH}")

# ── Adjust to match YOUR model's classes ──
# Run:  print(_model.names)  to see your classes
CLASS_MAP = {
    0: "door",
    1: "window",
    # 2: "room",  # uncomment if your model detects room zones
}

CONF_THRESH = 0.40


def detect(image: np.ndarray) -> dict:
    """
    Run YOLO on the image.
    Returns dict with doors, windows, zones lists.
    """
    logger.info("== Stage 2: YOLO Detection ==")
    logger.info(f"  Model classes: {_model.names}")

    results = _model(image, verbose=False)[0]

    doors = []
    windows = []
    zones = []

    for box in results.boxes:
        conf = float(box.conf[0])
        if conf < CONF_THRESH:
            continue

        cls_id = int(box.cls[0])
        cls_name = CLASS_MAP.get(cls_id, f"class_{cls_id}")
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        det = {
            "bbox": (x1, y1, x2, y2),
            "conf": round(conf, 3),
            "class": cls_name,
        }

        if cls_name == "door":
            doors.append(det)
        elif cls_name == "window":
            windows.append(det)
        else:
            zones.append(det)

    # Segmentation masks (YOLOv8-seg only)
    room_masks = []
    if results.masks is not None:
        for i, mask_tensor in enumerate(results.masks.data):
            cls_id = int(results.boxes.cls[i])
            if CLASS_MAP.get(cls_id) == "room":
                room_masks.append(mask_tensor.cpu().numpy())

    logger.info(
        f"  doors={len(doors)}  windows={len(windows)}  "
        f"zones={len(zones)}  seg_masks={len(room_masks)}"
    )

    return {
        "doors": doors,
        "windows": windows,
        "zones": zones,
        "room_masks": room_masks,
    }