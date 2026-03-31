"""
Stage 9: Preview generation
"""

import cv2
import numpy as np
import base64
import logging

logger = logging.getLogger(__name__)

CLR_ROOM = (0, 200, 0)
CLR_DOOR = (255, 50, 50)
CLR_WINDOW = (0, 220, 220)
CLR_SKELETON = (0, 0, 180)
CLR_TEXT = (255, 255, 255)
CLR_DIM = (255, 165, 0)
CLR_SCALE_BAR = (255, 255, 255)
CLR_BG = (0, 0, 0)


def draw_preview(image, rooms, doors, windows, skeleton,
                 ocr_labels, ocr_dimensions, scale):
    preview = image.copy()

    # Skeleton overlay (very thin, semi-transparent)
    if skeleton is not None and skeleton.shape == preview.shape[:2]:
        skel_colored = np.zeros_like(preview)
        skel_colored[skeleton > 0] = CLR_SKELETON
        preview = cv2.addWeighted(preview, 1.0, skel_colored, 0.3, 0)

    # Room contours + labels
    for room in rooms:
        cnt = np.array(room["contour"], dtype=np.int32)
        cv2.polylines(preview, [cnt], True, CLR_ROOM, 2)

        cx, cy = room["centroid"]
        label = f'{room["room_id"]}: {room["label"]}'
        area = room.get("area_sqft", room.get("area_m2", 0))
        unit = "sq ft" if "area_sqft" in room else "m2"
        area_str = f"{area:.0f} {unit}"

        # Background rectangles
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
        cv2.rectangle(preview, (cx - 2, cy - th - 2), (cx + tw + 2, cy + 2), CLR_BG, -1)
        cv2.putText(preview, label, (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.4, CLR_TEXT, 1)

        (aw, ah), _ = cv2.getTextSize(area_str, cv2.FONT_HERSHEY_SIMPLEX, 0.35, 1)
        cv2.rectangle(preview, (cx - 2, cy + 4), (cx + aw + 2, cy + ah + 8), CLR_BG, -1)
        cv2.putText(preview, area_str, (cx, cy + ah + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)

    # Doors
    for d in doors:
        x1, y1, x2, y2 = d["bbox"]
        cv2.rectangle(preview, (x1, y1), (x2, y2), CLR_DOOR, 2)
        cv2.putText(preview, "Door", (x1, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.3, CLR_DOOR, 1)

    # Windows
    for w in windows:
        x1, y1, x2, y2 = w["bbox"]
        cv2.rectangle(preview, (x1, y1), (x2, y2), CLR_WINDOW, 2)
        cv2.putText(preview, "Win", (x1, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.3, CLR_WINDOW, 1)

    # Dimensions
    for dim in ocr_dimensions:
        x, y = dim["x"], dim["y"]
        cv2.circle(preview, (x, y), 4, CLR_DIM, -1)
        cv2.putText(preview, dim["original_text"], (x + 6, y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.3, CLR_DIM, 1)

    # Scale bar
    img_h, img_w = preview.shape[:2]
    px_per_ft = scale.get("px_per_foot", 20)
    bar_ft = 10
    bar_px = int(px_per_ft * bar_ft)
    bar_y = img_h - 20
    bar_x = 10

    if 10 < bar_px < img_w - 30:
        cv2.line(preview, (bar_x, bar_y), (bar_x + bar_px, bar_y), CLR_SCALE_BAR, 2)
        cv2.line(preview, (bar_x, bar_y - 4), (bar_x, bar_y + 4), CLR_SCALE_BAR, 2)
        cv2.line(preview, (bar_x + bar_px, bar_y - 4), (bar_x + bar_px, bar_y + 4), CLR_SCALE_BAR, 2)
        cv2.putText(preview, f"{bar_ft} ft", (bar_x, bar_y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.4, CLR_SCALE_BAR, 1)

    return preview


def encode_image(image: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf).decode()