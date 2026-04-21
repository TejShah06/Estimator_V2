"""
Stage 7: Geometry Engine
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)


def _centre(bbox):
    x1, y1, x2, y2 = bbox
    return (x1 + x2) // 2, (y1 + y2) // 2


def _bbox_touches_contour(bbox, contour, margin=50):
    """Check if any point of bbox is inside or near contour."""
    x1, y1, x2, y2 = bbox
    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

    test_points = [
        (cx, cy),
        (x1, y1), (x2, y1),
        (x1, y2), (x2, y2),
        (cx, y1), (cx, y2),
        (x1, cy), (x2, cy),
    ]

    for px, py in test_points:
        dist = cv2.pointPolygonTest(contour, (float(px), float(py)), True)
        if dist >= -margin:
            return True
    return False


def _is_dimension_label(text: str) -> bool:
    t = text.upper().strip()
    if "X" in t:
        parts = t.split("X")
        if len(parts) == 2:
            left_digits = sum(c.isdigit() for c in parts[0])
            right_digits = sum(c.isdigit() for c in parts[1])
            if left_digits >= 1 and right_digits >= 1:
                return True
    if t.replace("'", "").replace('"', "").replace(" ", "").isdigit():
        return True
    return False


def compute_geometry(
    room_masks,
    scale,
    ocr_labels,
    doors,
    windows,
    wall_thickness_px,
    image_shape=None,
):
    logger.info("== Stage 7: Geometry Engine ==")

    ft_per_px = scale.get("foot_per_px", 0.05)
    m_per_px = scale.get("meter_per_px", 0.015)
    px_per_ft = scale.get("px_per_foot", 20.0)

    logger.info(f"  Scale: {px_per_ft:.4f} px/ft, {ft_per_px:.6f} ft/px")

    if image_shape is not None:
        margin = max(40, int(min(image_shape[:2]) / 15))
    else:
        margin = 50

    rooms = []
    used_label_indices = set()

    for idx, mask in enumerate(room_masks, start=1):
        cnts, _ = cv2.findContours(
            mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        if not cnts:
            continue

        cnt = max(cnts, key=cv2.contourArea)
        area_px = cv2.contourArea(cnt)
        peri_px = cv2.arcLength(cnt, True)

        if area_px == 0:
            continue

        # ✅ Convert pixel measurements to real-world units
        # area_sqft = area_px * (ft_per_px)^2
        # This means: each pixel is ft_per_px feet wide and tall
        # So each pixel covers ft_per_px^2 square feet
        area_sqft = area_px * (ft_per_px ** 2)
        area_m2 = area_px * (m_per_px ** 2)
        peri_ft = peri_px * ft_per_px
        peri_m = peri_px * m_per_px

        # Simplify contour
        epsilon = 0.01 * peri_px
        approx = cv2.approxPolyDP(cnt, epsilon, True)

        # Bounding rect
        x, y, w, h = cv2.boundingRect(cnt)

        # Also compute bbox-based area for validation
        bbox_area_sqft = (w * ft_per_px) * (h * ft_per_px)

        # Centroid
        M = cv2.moments(cnt)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
        else:
            cx = x + w // 2
            cy = y + h // 2

        # ── Assign OCR labels ──
        matched_labels = []
        matched_indices = []

        for i, lbl in enumerate(ocr_labels):
            if i in used_label_indices:
                continue

            test = cv2.pointPolygonTest(
                cnt, (float(lbl["x"]), float(lbl["y"])), True
            )

            if test >= -20:
                text_upper = lbl["text"].upper().strip()

                if _is_dimension_label(text_upper):
                    continue
                if len(text_upper) < 2:
                    continue
                if any(c.isalpha() for c in text_upper):
                    matched_labels.append(text_upper)
                    matched_indices.append(i)

        for mi in matched_indices:
            used_label_indices.add(mi)

        unique_labels = list(dict.fromkeys(matched_labels))
        clean_labels = [l for l in unique_labels if not _is_dimension_label(l)]

        if clean_labels:
            clean_labels.sort(key=len, reverse=True)
            room_name = clean_labels[0]
            if len(clean_labels) > 1:
                second = clean_labels[1]
                if second not in room_name and room_name not in second:
                    room_name = f"{second} {room_name}"
        else:
            room_name = f"Room {idx}"

        # ── Assign doors / windows ──
        room_doors = [
            d for d in doors
            if _bbox_touches_contour(d["bbox"], cnt, margin)
        ]
        room_windows = [
            w for w in windows
            if _bbox_touches_contour(w["bbox"], cnt, margin)
        ]

        wall_t_ft = wall_thickness_px * ft_per_px
        wall_t_m = wall_thickness_px * m_per_px

        rooms.append({
            "room_id": int(idx),
            "label": str(room_name),
            "contour": approx.tolist(),
            "centroid": (int(cx), int(cy)),
            "bbox": (int(x), int(y), int(w), int(h)),
            "area_px": int(area_px),
            "area_sqft": round(float(area_sqft), 2),
            "area_m2": round(float(area_m2), 2),
            "perimeter_px": round(float(peri_px), 1),
            "perimeter_ft": round(float(peri_ft), 2),
            "perimeter_m": round(float(peri_m), 2),
            "wall_length_ft": round(float(peri_ft), 2),
            "wall_length_m": round(float(peri_m), 2),
            "wall_thickness_ft": round(float(wall_t_ft), 3),
            "wall_thickness_m": round(float(wall_t_m), 3),
            "doors": int(len(room_doors)),
            "windows": int(len(room_windows)),
            "door_details": room_doors,
            "window_details": room_windows,
        })

        # ✅ Validation logging
        logger.info(
            f"  Room {idx}: '{room_name}' | "
            f"bbox={w}x{h}px | "
            f"contour_area={area_px}px² | "
            f"area={area_sqft:.1f}sqft | "
            f"bbox_area={bbox_area_sqft:.1f}sqft | "
            f"doors={len(room_doors)} win={len(room_windows)}"
        )

    logger.info(f"  Total Rooms: {len(rooms)}")
    return rooms
