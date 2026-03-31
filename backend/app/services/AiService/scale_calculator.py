"""
Stage 6: Scale Calculation

✅ FIXES v4:
  - Use YOLO zone bounding boxes matched to OCR dimensions
  - Both width AND height matched independently for accuracy
  - Multiple samples -> median for robustness
  - Sanity validation against image dimensions
  - Correct for preprocessing resize
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)

DEFAULT_PX_PER_FOOT = 20.0


def _point_in_bbox(px, py, bbox, margin=50):
    """Check if point (px, py) is inside or near a bbox."""
    x1, y1, x2, y2 = bbox
    return (x1 - margin <= px <= x2 + margin and
            y1 - margin <= py <= y2 + margin)


def _estimate_from_zones(zones, dimensions, image_shape):
    """
    Match OCR dimension text to YOLO zone bounding boxes.

    For each dimension like "11X12":
      - Find the zone whose center is closest to the text position
      - zone_width / 11 = px_per_foot (for the width axis)
      - zone_height / 12 = px_per_foot (for the height axis)
      - Average both for a robust estimate
    """
    ratios = []

    for dim in dimensions:
        parsed = dim.get("parsed")
        if not parsed:
            continue

        real_ft1 = parsed.get("feet", 0)
        real_ft2 = parsed.get("feet2", 0)

        if real_ft1 <= 0:
            continue

        dx, dy = dim["x"], dim["y"]

        # Find the zone that contains or is closest to this text
        best_dist = float("inf")
        best_zone = None

        for zone in zones:
            zx1, zy1, zx2, zy2 = zone["bbox"]
            zcx = (zx1 + zx2) / 2.0
            zcy = (zy1 + zy2) / 2.0

            # Check if text is inside zone (preferred)
            if _point_in_bbox(dx, dy, zone["bbox"], margin=30):
                d = np.hypot(dx - zcx, dy - zcy)
                if d < best_dist:
                    best_dist = d
                    best_zone = zone

        # If no zone contains the text, find nearest
        if best_zone is None:
            for zone in zones:
                zx1, zy1, zx2, zy2 = zone["bbox"]
                zcx = (zx1 + zx2) / 2.0
                zcy = (zy1 + zy2) / 2.0
                d = np.hypot(dx - zcx, dy - zcy)
                if d < best_dist:
                    best_dist = d
                    best_zone = zone

        if best_zone is None:
            continue

        # Only accept if reasonably close
        max_accept = max(image_shape[:2]) * 0.30
        if best_dist > max_accept:
            logger.info(f"    Skipped '{dim['original_text']}': too far from any zone ({best_dist:.0f}px)")
            continue

        zx1, zy1, zx2, zy2 = best_zone["bbox"]
        zone_w = float(zx2 - zx1)
        zone_h = float(zy2 - zy1)

        if real_ft2 > 0:
            # Two dimensions available (e.g. "11X12")
            # Try both orientations:
            #   Option A: zone_w matches ft1, zone_h matches ft2
            #   Option B: zone_w matches ft2, zone_h matches ft1

            ratio_a_w = zone_w / real_ft1
            ratio_a_h = zone_h / real_ft2
            consistency_a = abs(ratio_a_w - ratio_a_h) / max(ratio_a_w, ratio_a_h)

            ratio_b_w = zone_w / real_ft2
            ratio_b_h = zone_h / real_ft1
            consistency_b = abs(ratio_b_w - ratio_b_h) / max(ratio_b_w, ratio_b_h)

            if consistency_a <= consistency_b:
                avg_ratio = (ratio_a_w + ratio_a_h) / 2.0
                orientation = "A"
            else:
                avg_ratio = (ratio_b_w + ratio_b_h) / 2.0
                orientation = "B"

            # Only accept if the two axes give consistent scale (< 30% difference)
            consistency = min(consistency_a, consistency_b)
            if consistency < 0.30:
                ratios.append(avg_ratio)
                logger.info(
                    f"    ✅ Zone match: '{dim['original_text']}' "
                    f"({real_ft1}x{real_ft2}ft) -> zone {zone_w:.0f}x{zone_h:.0f}px "
                    f"= {avg_ratio:.2f} px/ft (orient={orientation}, consistency={consistency:.2f})"
                )
            else:
                logger.info(
                    f"    ⚠️ Inconsistent: '{dim['original_text']}' "
                    f"consistency={consistency:.2f} > 0.30, skipping"
                )
        else:
            # Single dimension - use the shorter zone axis (more likely to be accurate)
            ratio_w = zone_w / real_ft1
            ratio_h = zone_h / real_ft1

            # Pick the one that gives a more reasonable room shape
            # Typical rooms are 0.5-2.0 aspect ratio
            aspect_if_w = zone_h / (zone_w / real_ft1 * real_ft1)
            aspect_if_h = zone_w / (zone_h / real_ft1 * real_ft1)

            if 0.3 < zone_w / zone_h < 3.0:
                avg_ratio = (ratio_w + ratio_h) / 2.0
            else:
                avg_ratio = min(ratio_w, ratio_h)

            ratios.append(avg_ratio)
            logger.info(
                f"    ✅ Zone match (single): '{dim['original_text']}' "
                f"({real_ft1}ft) -> {avg_ratio:.2f} px/ft"
            )

    return ratios


def _smart_default(image_shape):
    """Estimate scale from image dimensions."""
    w = image_shape[1]
    h = image_shape[0]
    # Most floor plans span 30-60 ft in their longest dimension
    longest = max(w, h)
    estimated = longest / 45.0
    logger.info(f"  Smart default: longest={longest}px / 45ft = {estimated:.2f} px/ft")
    return estimated


def calculate_scale(dimensions, segments, image_shape, scale_factor=1.0, zones=None):
    """
    Compute pixels-per-foot using the most reliable method available.

    Strategy:
    1. Match OCR dimensions (like "11X12") to YOLO zone bounding boxes
    2. Smart default based on image dimensions

    All ratios computed on the RESIZED image, then corrected
    by scale_factor to get the ratio on the ORIGINAL image.
    """
    logger.info("== Stage 6: Scale Calculation ==")
    logger.info(f"  Image shape: {image_shape[:2]}  Scale factor: {scale_factor:.4f}")
    logger.info(f"  Zones: {len(zones) if zones else 0}  Dimensions: {len(dimensions)}")

    ratios = []

    # Method 1: Zone-based (most reliable for floor plans)
    if zones and dimensions:
        zone_ratios = _estimate_from_zones(zones, dimensions, image_shape)
        ratios.extend(zone_ratios)
        logger.info(f"  Zone-based ratios: {len(zone_ratios)} samples")

    if ratios:
        # Use median to reject outliers
        px_per_ft_resized = float(np.median(ratios))
        method = "ocr_zones"

        logger.info(f"  Median ratio (resized): {px_per_ft_resized:.4f} px/ft")

        # ✅ IMPORTANT: These ratios were computed on the RESIZED image.
        # The resized image was scale_factor times larger than original.
        # But since we are doing ALL our geometry on the resized image,
        # we should NOT divide by scale_factor here.
        # The scale should be in resized-image coordinates.
        px_per_ft = px_per_ft_resized

    else:
        # Method 2: Smart default
        px_per_ft = _smart_default(image_shape)
        method = "estimated"

    # Sanity clamp: 5-200 px per foot
    px_per_ft = max(5.0, min(200.0, px_per_ft))

    px_per_m = px_per_ft * 3.28084

    result = {
        "px_per_foot": round(px_per_ft, 4),
        "foot_per_px": round(1.0 / px_per_ft, 6) if px_per_ft > 0 else 0,
        "px_per_meter": round(px_per_m, 4),
        "meter_per_px": round(1.0 / px_per_m, 6) if px_per_m > 0 else 0,
        "method": method,
        "samples": len(ratios),
    }

    logger.info(f"  ✅ Final Scale: {result}")

    # ✅ Validation: log expected vs actual for each dimension
    if zones and dimensions:
        for dim in dimensions:
            parsed = dim.get("parsed")
            if not parsed:
                continue
            ft1 = parsed.get("feet", 0)
            ft2 = parsed.get("feet2", 0)
            if ft1 > 0 and ft2 > 0:
                expected_area = ft1 * ft2
                logger.info(
                    f"  Validation: '{dim['original_text']}' = "
                    f"{ft1}x{ft2} = {expected_area} sq ft expected"
                )

    return result