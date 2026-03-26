import cv2
import numpy as np
import logging
from pathlib import Path
from typing import List, Tuple
from dataclasses import dataclass

from ultralytics import YOLO
import easyocr


logger = logging.getLogger(__name__)

# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]
_MODEL_PATH = BASE_DIR / "modelML" / "best.pt"

_yolo_model = None
_reader = None


def _get_yolo_model():
    global _yolo_model

    if _yolo_model is None:

        logger.info(f"Loading YOLO model from: {_MODEL_PATH}")

        if not _MODEL_PATH.exists():
            raise RuntimeError(f"YOLO model not found: {_MODEL_PATH}")

        _yolo_model = YOLO(str(_MODEL_PATH))

    return _yolo_model


def _get_ocr():

    global _reader

    if _reader is None:

        logger.info("Loading EasyOCR...")

        _reader = easyocr.Reader(['en'], gpu=False)

    return _reader


# ============================================================
# DATA STRUCTURE
# ============================================================

@dataclass
class RoomInfo:

    room_id: str
    contour: np.ndarray
    area_px: float
    perimeter_px: float
    bbox: Tuple[int, int, int, int]
    centroid: Tuple[int, int]


# ============================================================
# IMAGE DECODER
# ============================================================

def _decode_image(image_bytes: bytes):

    nparr = np.frombuffer(image_bytes, np.uint8)

    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise RuntimeError("Failed to decode image")

    return image


# ============================================================
# AUTO UPSCALE
# ============================================================

def _auto_upscale(image):

    h, w = image.shape[:2]

    min_target = 1500

    if max(h, w) < min_target:

        scale = min_target / max(h, w)

        image = cv2.resize(
            image,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC
        )

        logger.info(f"Upscaled image → {image.shape[1]} x {image.shape[0]}")

    return image


# ============================================================
# WALL DETECTION
# ============================================================

def _detect_walls(image):

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    _, thresh = cv2.threshold(
        blur,
        0,
        255,
        cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )

    kernel = np.ones((3, 3), np.uint8)

    walls = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

    walls = cv2.dilate(walls, kernel, iterations=1)

    return walls


# ============================================================
# ROOM SEGMENTATION
# ============================================================

def _segment_rooms(walls, h, w):

    room_space = cv2.bitwise_not(walls)

    kernel = np.ones((3, 3), np.uint8)

    room_space = cv2.morphologyEx(room_space, cv2.MORPH_OPEN, kernel, iterations=2)

    dist = cv2.distanceTransform(room_space, cv2.DIST_L2, 5)

    _, sure_fg = cv2.threshold(dist, 0.35 * dist.max(), 255, 0)

    sure_fg = np.uint8(sure_fg)

    sure_bg = cv2.dilate(room_space, kernel, iterations=3)

    unknown = cv2.subtract(sure_bg, sure_fg)

    num_labels, markers = cv2.connectedComponents(sure_fg)

    markers = markers + 1

    markers[unknown == 255] = 0

    walls_color = cv2.cvtColor(walls, cv2.COLOR_GRAY2BGR)

    markers = cv2.watershed(walls_color, markers)

    rooms = []

    min_area = max(500, int(h * w * 0.002))

    for label in range(2, np.max(markers) + 1):

        mask = np.uint8(markers == label) * 255

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            continue

        cnt = max(contours, key=cv2.contourArea)

        area = cv2.contourArea(cnt)

        if area < min_area:
            continue

        perimeter = cv2.arcLength(cnt, True)

        x, y, bw, bh = cv2.boundingRect(cnt)

        m = cv2.moments(cnt)

        if m["m00"] > 0:

            cx = int(m["m10"] / m["m00"])
            cy = int(m["m01"] / m["m00"])

        else:

            cx = x + bw // 2
            cy = y + bh // 2

        rooms.append(

            RoomInfo(
                room_id=f"room_{len(rooms)+1}",
                contour=cnt,
                area_px=area,
                perimeter_px=perimeter,
                bbox=(x, y, bw, bh),
                centroid=(cx, cy)
            )
        )

    return rooms


# ============================================================
# YOLO DETECTION
# ============================================================

def _detect_doors_windows(image):

    model = _get_yolo_model()

    results = model(image)[0]

    detections = []

    for box in results.boxes:

        cls = int(box.cls[0])
        conf = float(box.conf[0])

        x1, y1, x2, y2 = map(int, box.xyxy[0])

        detections.append(
            {
                "class": model.names[cls],
                "conf": conf,
                "bbox": (x1, y1, x2, y2)
            }
        )

    return detections


# ============================================================
# OCR DIMENSIONS
# ============================================================

def _read_dimensions(image):

    reader = _get_ocr()

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    results = reader.readtext(gray)

    dims = []

    for bbox, text, conf in results:

        txt = text.lower()

        if "x" in txt or "×" in txt:
            dims.append(text)

    return dims


# ============================================================
# SCALE ESTIMATION
# ============================================================

def _estimate_scale(dims):

    if not dims:
        return None

    try:

        txt = dims[0].lower().replace("×", "x")

        a, b = txt.split("x")

        a = float(a.strip())
        b = float(b.strip())

        return (a + b) / 2

    except:

        return None


# ============================================================
# PREVIEW GENERATOR
# ============================================================

def _generate_preview(image, rooms, detections, dims):

    preview = image.copy()

    # draw rooms
    for room in rooms:

        cv2.drawContours(preview, [room.contour], -1, (0, 255, 0), 3)

        cx, cy = room.centroid

        cv2.putText(
            preview,
            room.room_id,
            (cx - 20, cy),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255),
            2
        )

    # draw doors/windows
    for det in detections:

        x1, y1, x2, y2 = det["bbox"]
        cls = det["class"]

        if cls == "door":
            color = (255, 0, 0)

        elif cls == "window":
            color = (0, 255, 255)

        else:
            color = (200, 200, 200)

        cv2.rectangle(preview, (x1, y1), (x2, y2), color, 2)

        cv2.putText(
            preview,
            cls,
            (x1, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2
        )

    # draw dimensions
    y_offset = 30

    for dim in dims:

        cv2.putText(
            preview,
            f"Dim: {dim}",
            (20, y_offset),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 0),
            2
        )

        y_offset += 25

    # save preview
    preview_dir = BASE_DIR.parent / "previews"

    preview_dir.mkdir(exist_ok=True)

    preview_path = preview_dir / "preview.jpg"

    cv2.imwrite(str(preview_path), preview)

    return str(preview_path)


# ============================================================
# MAIN PIPELINE
# ============================================================

def analyze_floorplan(image_bytes: bytes):

    logger.info("PIPELINE START")

    image = _decode_image(image_bytes)

    image = _auto_upscale(image)

    h, w = image.shape[:2]

    walls = _detect_walls(image)

    rooms = _segment_rooms(walls, h, w)

    if not rooms:

        return {
            "rooms_count": 0,
            "doors_count": 0,
            "windows_count": 0,
            "scale": None,
            "preview": None
        }

    detections = _detect_doors_windows(image)

    dims = _read_dimensions(image)

    scale = _estimate_scale(dims)

    preview_path = _generate_preview(image, rooms, detections, dims)

    return {

        "rooms_count": len(rooms),

        "doors_count": sum(
            1 for d in detections if d["class"] == "door"
        ),

        "windows_count": sum(
            1 for d in detections if d["class"] == "window"
        ),

        "scale": scale,

        "preview": preview_path
    }