"""
Stage 1: Image Preprocessing
- Decode bytes to OpenCV image
- Resize for consistency
- Denoise + contrast enhancement
- Binarization
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

MAX_DIM = 1200  #  Lowered from 1600 for better accuracy + speed
MIN_DIM = 600


def bytes_to_image(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Cannot decode image bytes")
    return image


def resize_image(image: np.ndarray):
    h, w = image.shape[:2]
    longest = max(h, w)

    if MIN_DIM <= longest <= MAX_DIM:
        return image.copy(), 1.0

    scale = MAX_DIM / longest
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    logger.info(f"Resized {w}x{h} -> {new_w}x{new_h} (scale={scale:.4f})")
    return resized, scale


def enhance(image: np.ndarray) -> np.ndarray:
    denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l_ch, a_ch, b_ch = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_ch = clahe.apply(l_ch)
    enhanced = cv2.merge([l_ch, a_ch, b_ch])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


def binarize(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=21,
        C=10,
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
    return binary


def preprocess(image_bytes: bytes) -> dict:
    logger.info("== Stage 1: Preprocessing ==")
    original = bytes_to_image(image_bytes)
    resized, scale_factor = resize_image(original)
    enhanced = enhance(resized)
    binary = binarize(enhanced)

    logger.info(
        f"  original={original.shape[:2]}  "
        f"resized={resized.shape[:2]}  "
        f"scale_factor={scale_factor}"
    )

    return {
        "original": original,
        "resized": resized,
        "scale_factor": scale_factor,
        "enhanced": enhanced,
        "binary": binary,
        "gray": cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY),
    }
