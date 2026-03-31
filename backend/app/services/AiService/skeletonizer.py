"""
Stage 4: Skeletonization - extract wall centrelines
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Try skimage; fallback to manual
try:
    from skimage.morphology import skeletonize as _skimage_skeletonize
    _USE_SKIMAGE = True
except ImportError:
    _USE_SKIMAGE = False
    logger.warning("scikit-image not installed, using manual skeletonization")


def _skeleton(mask: np.ndarray) -> np.ndarray:
    if _USE_SKIMAGE:
        binary_01 = (mask > 0).astype(np.uint8)
        skel = _skimage_skeletonize(binary_01).astype(np.uint8) * 255
        return skel
    else:
        return _manual_skeleton(mask)


def _manual_skeleton(binary: np.ndarray) -> np.ndarray:
    """Manual skeletonization using morphological operations."""
    img = (binary > 0).astype(np.uint8) * 255
    skel = np.zeros_like(img)
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))

    while True:
        eroded = cv2.erode(img, element)
        temp = cv2.dilate(eroded, element)
        temp = cv2.subtract(img, temp)
        skel = cv2.bitwise_or(skel, temp)
        img = eroded.copy()
        if cv2.countNonZero(img) == 0:
            break

    return skel


def _hough_lines(skeleton: np.ndarray) -> list:
    lines_raw = cv2.HoughLinesP(
        skeleton,
        rho=1,
        theta=np.pi / 180,
        threshold=15,      # ✅ Lowered from 30 to catch shorter walls
        minLineLength=15,   # ✅ Lowered from 20
        maxLineGap=10,
    )

    segments = []
    if lines_raw is None:
        return segments

    for line in lines_raw:
        x1, y1, x2, y2 = line[0]
        length = np.hypot(x2 - x1, y2 - y1)
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1)) % 180
        segments.append({
            "pt1": (int(x1), int(y1)),
            "pt2": (int(x2), int(y2)),
            "length_px": round(float(length), 2),
            "angle_deg": round(float(angle), 2),
        })

    return segments


def _measure_thickness(
    wall_mask: np.ndarray, skeleton: np.ndarray
) -> float:
    dist = cv2.distanceTransform(wall_mask, cv2.DIST_L2, 5)
    skel_pts = skeleton > 0
    if np.any(skel_pts):
        mean_half = float(np.mean(dist[skel_pts]))
        return round(mean_half * 2, 2)
    return 0.0


def extract_centrelines(wall_mask: np.ndarray) -> dict:
    """
    Returns:
        {
            "skeleton":          np.ndarray,
            "segments":          [{"pt1", "pt2", "length_px", "angle_deg"}],
            "wall_thickness_px": float,
        }
    """
    logger.info("== Stage 4: Skeletonization ==")
    skel = _skeleton(wall_mask)
    segments = _hough_lines(skel)
    thickness = _measure_thickness(wall_mask, skel)
    logger.info(
        f"  segments={len(segments)}  wall_thickness={thickness}px"
    )
    return {
        "skeleton": skel,
        "segments": segments,
        "wall_thickness_px": thickness,
    }