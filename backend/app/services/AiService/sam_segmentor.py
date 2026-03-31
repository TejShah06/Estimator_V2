"""
Stage 3: SAM Wall Segmentation

✅ FIXES v5:
  - Added overlap resolution: removes duplicate/overlapping rooms
  - YOLO zone-based segmentation with overlap filtering
  - Watershed fallback with overlap filtering
"""

import cv2
import numpy as np
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_APP_DIR = Path(__file__).resolve().parents[2]
SAM_CHECKPOINT = _APP_DIR / "modelML" / "sam_vit_h.pth"
SAM_MODEL_TYPE = "vit_h"

_sam_predictor = None

try:
    import torch
    from segment_anything import sam_model_registry, SamPredictor

    if SAM_CHECKPOINT.exists():
        _device = "cuda" if torch.cuda.is_available() else "cpu"
        _sam = sam_model_registry[SAM_MODEL_TYPE](
            checkpoint=str(SAM_CHECKPOINT)
        )
        _sam.to(device=_device)
        _sam_predictor = SamPredictor(_sam)
        logger.info(f"SAM loaded on {_device}")
    else:
        logger.warning(f"SAM checkpoint not found: {SAM_CHECKPOINT}")
except ImportError:
    logger.warning("segment_anything not installed")


# ──────────────────────────────────────────────────────
# OVERLAP RESOLUTION - The key fix
# ──────────────────────────────────────────────────────

def _compute_iou(mask1, mask2):
    """Compute Intersection over Union between two binary masks."""
    intersection = cv2.bitwise_and(mask1, mask2)
    union = cv2.bitwise_or(mask1, mask2)

    inter_area = cv2.countNonZero(intersection)
    union_area = cv2.countNonZero(union)

    if union_area == 0:
        return 0.0

    return inter_area / union_area


def _compute_containment(mask_small, mask_large):
    """
    What fraction of mask_small is inside mask_large?
    Returns 0.0 to 1.0
    If returns 0.8, it means 80% of mask_small is inside mask_large.
    """
    inter = cv2.bitwise_and(mask_small, mask_large)
    inter_area = cv2.countNonZero(inter)
    small_area = cv2.countNonZero(mask_small)

    if small_area == 0:
        return 0.0

    return inter_area / small_area


def _resolve_overlaps(room_masks, ocr_labels=None, overlap_threshold=0.3):
    """
    Remove overlapping room masks.

    Strategy:
    1. For each pair of masks, compute overlap
    2. If overlap > threshold:
       - If one contains the other (>70%), keep the SMALLER one
         (it's more precise / the larger is a duplicate)
       - If partial overlap, subtract the overlap from the larger mask
    3. Remove any mask that becomes too small after subtraction

    Args:
        room_masks: list of binary masks
        ocr_labels: optional, used to prefer rooms with labels
        overlap_threshold: IoU threshold to trigger resolution

    Returns:
        Filtered list of non-overlapping masks
    """
    if len(room_masks) <= 1:
        return room_masks

    n = len(room_masks)
    areas = [cv2.countNonZero(m) for m in room_masks]

    # Sort by area descending (process largest first)
    indices = sorted(range(n), key=lambda i: areas[i], reverse=True)
    sorted_masks = [room_masks[i] for i in indices]
    sorted_areas = [areas[i] for i in indices]

    keep = [True] * n
    final_masks = [m.copy() for m in sorted_masks]

    for i in range(n):
        if not keep[i]:
            continue

        for j in range(i + 1, n):
            if not keep[j]:
                continue

            mask_i = final_masks[i]
            mask_j = final_masks[j]

            iou = _compute_iou(mask_i, mask_j)

            if iou < overlap_threshold:
                continue

            # There IS significant overlap
            area_i = cv2.countNonZero(mask_i)
            area_j = cv2.countNonZero(mask_j)

            # Check containment: is smaller fully inside larger?
            if area_i >= area_j:
                containment = _compute_containment(mask_j, mask_i)
            else:
                containment = _compute_containment(mask_i, mask_j)

            logger.info(
                f"    Overlap detected: room {i} ({area_i}px) vs "
                f"room {j} ({area_j}px) | IoU={iou:.2f} containment={containment:.2f}"
            )

            if containment > 0.65:
                # One room is mostly inside the other
                # Keep the SMALLER one (it's the actual room)
                # Remove the LARGER one (it's a duplicate/container)
                if area_i >= area_j:
                    # i is larger, j is smaller and inside i
                    # Keep j, remove overlap from i
                    final_masks[i] = cv2.subtract(mask_i, mask_j)
                    remaining = cv2.countNonZero(final_masks[i])
                    logger.info(
                        f"    -> Subtracted room {j} from room {i}. "
                        f"Room {i} remaining: {remaining}px"
                    )
                    # If the larger mask has very little left, remove it
                    if remaining < sorted_areas[j] * 0.3:
                        keep[i] = False
                        logger.info(f"    -> Removed room {i} (too small after subtraction)")
                else:
                    # j is larger, i is smaller and inside j
                    final_masks[j] = cv2.subtract(mask_j, mask_i)
                    remaining = cv2.countNonZero(final_masks[j])
                    logger.info(
                        f"    -> Subtracted room {i} from room {j}. "
                        f"Room {j} remaining: {remaining}px"
                    )
                    if remaining < sorted_areas[i] * 0.3:
                        keep[j] = False
                        logger.info(f"    -> Removed room {j} (too small after subtraction)")

            else:
                # Partial overlap - subtract from the larger mask
                if area_i >= area_j:
                    intersection = cv2.bitwise_and(mask_i, mask_j)
                    final_masks[i] = cv2.subtract(mask_i, intersection)
                    logger.info(f"    -> Partial: subtracted overlap from room {i}")
                else:
                    intersection = cv2.bitwise_and(mask_i, mask_j)
                    final_masks[j] = cv2.subtract(mask_j, intersection)
                    logger.info(f"    -> Partial: subtracted overlap from room {j}")

    # Collect surviving masks
    result = []
    min_area = sorted_areas[-1] * 0.1 if sorted_areas else 100  # minimum viable room

    for i in range(n):
        if not keep[i]:
            continue

        area = cv2.countNonZero(final_masks[i])
        if area < min_area:
            logger.info(f"    Discarded room {i}: too small after overlap resolution ({area}px)")
            continue

        result.append(final_masks[i])

    logger.info(f"  Overlap resolution: {n} -> {len(result)} rooms")
    return result


# ──────────────────────────────────────────────────────
# SAM-based segmentation
# ──────────────────────────────────────────────────────

def _sam_segment_walls(image, binary, zones):
    _sam_predictor.set_image(image)
    h, w = image.shape[:2]
    all_room_mask = np.zeros((h, w), dtype=np.uint8)
    room_masks = []

    if zones:
        for z in zones:
            x1, y1, x2, y2 = z["bbox"]
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            point_coords = np.array([[cx, cy]])
            point_labels = np.array([1])
            masks, scores, _ = _sam_predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=True,
            )
            best = masks[np.argmax(scores)]
            best_uint8 = (best * 255).astype(np.uint8)
            room_masks.append(best_uint8)
            all_room_mask = cv2.bitwise_or(all_room_mask, best_uint8)

    # ✅ Resolve overlaps
    room_masks = _resolve_overlaps(room_masks)

    wall_mask = binary.copy()
    return {"wall_mask": wall_mask, "room_masks": room_masks}


# ──────────────────────────────────────────────────────
# YOLO Zone-based room extraction
# ──────────────────────────────────────────────────────

def _zone_based_segmentation(image, binary, zones, doors):
    """
    Use YOLO detected zone bounding boxes as room regions.
    Apply overlap resolution to remove duplicates.
    """
    logger.info(f"  Using YOLO zone-based segmentation ({len(zones)} zones)")

    h, w = image.shape[:2]
    room_masks = []

    # Invert binary: rooms = white areas (non-wall)
    room_space = cv2.bitwise_not(binary)

    # Close door openings in room_space to separate rooms
    for door in doors:
        dx1, dy1, dx2, dy2 = door["bbox"]
        door_w = dx2 - dx1
        door_h = dy2 - dy1
        if door_w > door_h:
            cy = (dy1 + dy2) // 2
            cv2.line(room_space, (dx1, cy), (dx2, cy), 0, 6)
        else:
            cx_d = (dx1 + dx2) // 2
            cv2.line(room_space, (cx_d, dy1), (cx_d, dy2), 0, 6)

    for zone in zones:
        x1, y1, x2, y2 = zone["bbox"]

        # Clamp to image bounds
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        zone_w = x2 - x1
        zone_h = y2 - y1

        if zone_w < 25 or zone_h < 25:
            continue

        # Create mask from zone bbox intersected with room space
        zone_mask = np.zeros((h, w), dtype=np.uint8)
        zone_mask[y1:y2, x1:x2] = 255
        room_mask = cv2.bitwise_and(zone_mask, room_space)

        # Clean up
        kernel = np.ones((5, 5), np.uint8)
        room_mask = cv2.morphologyEx(room_mask, cv2.MORPH_OPEN, kernel)
        room_mask = cv2.morphologyEx(room_mask, cv2.MORPH_CLOSE, kernel)

        # Find largest contour
        cnts, _ = cv2.findContours(
            room_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        if not cnts:
            continue

        largest = max(cnts, key=cv2.contourArea)
        area = cv2.contourArea(largest)

        min_area = h * w * 0.005
        if area < min_area:
            continue

        # Create clean mask
        clean_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(clean_mask, [largest], -1, 255, -1)
        room_masks.append(clean_mask)

    logger.info(f"  Raw zone masks: {len(room_masks)}")

    # ✅ CRITICAL: Resolve overlapping rooms
    room_masks = _resolve_overlaps(room_masks, overlap_threshold=0.25)

    wall_mask = binary.copy()
    return {"wall_mask": wall_mask, "room_masks": room_masks}


# ──────────────────────────────────────────────────────
# Fallback: improved watershed
# ──────────────────────────────────────────────────────

def _fallback_segment_walls(image, binary, doors):
    logger.info("  Using fallback watershed segmentation")

    h, w = binary.shape
    kernel = np.ones((5, 5), np.uint8)

    room_binary = cv2.bitwise_not(binary)

    # Close door openings
    for door in doors:
        x1, y1, x2, y2 = door["bbox"]
        door_w = x2 - x1
        door_h = y2 - y1
        if door_w > door_h:
            cy = (y1 + y2) // 2
            cv2.line(room_binary, (x1, cy), (x2, cy), 0, 8)
        else:
            cx = (x1 + x2) // 2
            cv2.line(room_binary, (cx, y1), (cx, y2), 0, 8)

    big_kernel = np.ones((7, 7), np.uint8)
    room_binary = cv2.morphologyEx(room_binary, cv2.MORPH_OPEN, big_kernel, iterations=3)
    room_binary = cv2.morphologyEx(room_binary, cv2.MORPH_CLOSE, big_kernel, iterations=2)

    dist = cv2.distanceTransform(room_binary, cv2.DIST_L2, 5)
    max_val = dist.max()

    if max_val == 0:
        logger.warning("  No room interior detected")
        return {"wall_mask": binary.copy(), "room_masks": []}

    _, sure_fg = cv2.threshold(dist, 0.35 * max_val, 255, 0)
    sure_fg = np.uint8(sure_fg)

    sure_bg = cv2.dilate(room_binary, kernel, iterations=3)
    unknown = cv2.subtract(sure_bg, sure_fg)

    ret, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0
    markers = cv2.watershed(image, markers)

    min_area = h * w * 0.02
    max_area = h * w * 0.60

    room_masks = []

    for lbl in np.unique(markers):
        if lbl <= 1:
            continue

        mask = np.zeros((h, w), dtype=np.uint8)
        mask[markers == lbl] = 255
        area = cv2.countNonZero(mask)

        if area < min_area:
            continue
        if area > max_area:
            continue

        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            cnt = max(cnts, key=cv2.contourArea)
            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect = max(bw, bh) / (min(bw, bh) + 1)
            if aspect > 6.0:
                continue

        room_masks.append(mask)

    # ✅ Resolve overlaps for watershed too
    room_masks = _resolve_overlaps(room_masks)

    wall_mask = binary.copy()
    logger.info(f"  Watershed result: {len(room_masks)} rooms")
    return {"wall_mask": wall_mask, "room_masks": room_masks}


# ──────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────

def segment_walls(image, binary, zones, doors):
    """
    Strategy:
    1. SAM if available
    2. YOLO zones if >= 3 detected
    3. Watershed fallback

    All methods apply overlap resolution.
    """
    logger.info("== Stage 3: Wall Segmentation ==")

    if _sam_predictor is not None:
        result = _sam_segment_walls(image, binary, zones)
    elif zones and len(zones) >= 3:
        result = _zone_based_segmentation(image, binary, zones, doors)
    else:
        result = _fallback_segment_walls(image, binary, doors)

    logger.info(
        f"  Final: {len(result['room_masks'])} non-overlapping rooms  "
        f"Wall pixels: {cv2.countNonZero(result['wall_mask'])}"
    )
    return result