"""
Stage 5: OCR - text labels AND dimension strings

✅ FIXES v4:
  - Added bare "NUMBERxNUMBER" format (11X12, 12x13)
  - This is the most common format in simple floor plans
  - Better separation of dimension text vs room labels
"""

import re
import numpy as np
import logging
import easyocr

logger = logging.getLogger(__name__)

_reader = easyocr.Reader(["en"], gpu=False)

# ── Dimension patterns (ordered by specificity) ──
_DIM_PATTERNS = [
    # 14'6 x 12'3 or 14'6"x12'3"
    (r"(\d+)['\u2019]\s*(\d+)[\"″]?\s*[xX×]\s*(\d+)['\u2019]\s*(\d+)[\"″]?",
     "imperial_area"),

    # 14'x12' (no inches)
    (r"(\d+)['\u2019]\s*[xX×]\s*(\d+)['\u2019]",
     "imperial_area_no_inches"),

    # ✅ NEW: Bare NUMBERxNUMBER (11X12, 12x13) - most common simple format
    (r"(\d{1,3})\s*[xX×]\s*(\d{1,3})",
     "bare_area"),

    # Single: 12'6" or 12'-6"
    (r"(\d+)['\u2019]\s*-?\s*(\d+)[\"″\u201D]?",
     "imperial"),

    # Single: 12'
    (r"(\d+)['\u2019]\s*$",
     "imperial_feet_only"),

    # Metric
    (r"([\d]+(?:[.,]\d+)?)\s*mm\b", "mm"),
    (r"([\d]+(?:[.,]\d+)?)\s*cm\b", "cm"),
    (r"([\d]+(?:[.,]\d+)?)\s*m\b", "m"),

    # Bare large number (likely mm)
    (r"^(\d{3,5})$", "bare_mm"),
]

# ── OCR corrections ──
_OCR_CORRECTIONS = {
    "BEDROOH": "BEDROOM",
    "BEDROON": "BEDROOM",
    "BEDROOF": "BEDROOM",
    "BEDROO": "BEDROOM",
    "BEDROH": "BEDROOM",
    "BEDROM": "BEDROOM",
    "BEOROOM": "BEDROOM",
    "BEDROOMM": "BEDROOM",
    "BEDROOMMT": "BEDROOM",
    "BEDROOI": "BEDROOM",
    "NASTER": "MASTER",
    "HASTER": "MASTER",
    "ASTER": "MASTER",
    "DIING": "DINING",
    "DIINING": "DINING",
    "DINIG": "DINING",
    "LIUING": "LIVING",
    "LIVNG": "LIVING",
    "LIVIN": "LIVING",
    "LIVINGG": "LIVING",
    "KITCHEM": "KITCHEN",
    "KITCHEH": "KITCHEN",
    "BATHROOH": "BATHROOM",
    "BATHROON": "BATHROOM",
    "ROOH": "ROOM",
    "ROON": "ROOM",
    "ROOI": "ROOM",
    "ROH": "ROOM",
    "<IT": "KIT",
    "<iT": "KIT",
    "KIT.": "KITCHEN",
}


def _correct_ocr_text(text: str) -> str:
    corrected = text.upper().strip()
    words = corrected.split()
    fixed_words = []
    for word in words:
        fixed = _OCR_CORRECTIONS.get(word, word)
        fixed_words.append(fixed)
    corrected = " ".join(fixed_words)

    for wrong, right in _OCR_CORRECTIONS.items():
        if wrong in corrected and right not in corrected:
            corrected = corrected.replace(wrong, right)

    return corrected


def _is_dimension_text(text: str) -> bool:
    """Check if text looks like a dimension string."""
    t = text.strip()
    # Contains feet/inch markers
    if "'" in t or '"' in t or "×" in t:
        return True
    # Contains x/X between numbers: 11X12, 12x13
    if re.search(r"\d+\s*[xX×]\s*\d+", t):
        return True
    return False


def _parse_dimension(text: str):
    """Try to extract a real-world measurement from a string."""
    clean = text.strip()

    for pattern, kind in _DIM_PATTERNS:
        m = re.search(pattern, clean, re.IGNORECASE)
        if not m:
            continue

        if kind == "imperial_area":
            feet1 = int(m.group(1))
            inches1 = int(m.group(2) or 0)
            feet2 = int(m.group(3))
            inches2 = int(m.group(4) or 0)
            total_ft1 = feet1 + inches1 / 12.0
            total_ft2 = feet2 + inches2 / 12.0
            return {
                "value": f"{feet1}'{inches1}\" x {feet2}'{inches2}\"",
                "unit": "ft",
                "feet": round(total_ft1, 4),
                "feet2": round(total_ft2, 4),
                "meters": round(total_ft1 * 0.3048, 4),
            }

        if kind == "imperial_area_no_inches":
            feet1 = int(m.group(1))
            feet2 = int(m.group(2))
            return {
                "value": f"{feet1}' x {feet2}'",
                "unit": "ft",
                "feet": float(feet1),
                "feet2": float(feet2),
                "meters": round(feet1 * 0.3048, 4),
            }

        # ✅ NEW: bare NxN format (11X12)
        if kind == "bare_area":
            dim1 = int(m.group(1))
            dim2 = int(m.group(2))

            # Sanity check: dimensions should be reasonable room sizes
            # Rooms are typically 5-40 feet per side
            if 3 <= dim1 <= 50 and 3 <= dim2 <= 50:
                return {
                    "value": f"{dim1} x {dim2}",
                    "unit": "ft",
                    "feet": float(dim1),
                    "feet2": float(dim2),
                    "meters": round(dim1 * 0.3048, 4),
                }
            else:
                continue  # Not a valid room dimension

        if kind == "imperial":
            feet = int(m.group(1))
            inches = int(m.group(2) or 0)
            total_ft = feet + inches / 12.0
            return {
                "value": f"{feet}'{inches}\"",
                "unit": "ft",
                "feet": round(total_ft, 4),
                "meters": round(total_ft * 0.3048, 4),
            }

        if kind == "imperial_feet_only":
            feet = int(m.group(1))
            return {
                "value": f"{feet}'",
                "unit": "ft",
                "feet": float(feet),
                "meters": round(feet * 0.3048, 4),
            }

        if kind == "mm":
            val = float(m.group(1).replace(",", "."))
            return {
                "value": val, "unit": "mm",
                "feet": round(val / 304.8, 4),
                "meters": round(val / 1000, 4),
            }

        if kind == "cm":
            val = float(m.group(1).replace(",", "."))
            return {
                "value": val, "unit": "cm",
                "feet": round(val / 30.48, 4),
                "meters": round(val / 100, 4),
            }

        if kind == "m":
            val = float(m.group(1).replace(",", "."))
            return {
                "value": val, "unit": "m",
                "feet": round(val * 3.28084, 4),
                "meters": round(val, 4),
            }

        if kind == "bare_mm":
            val = int(m.group(1))
            return {
                "value": val, "unit": "mm",
                "feet": round(val / 304.8, 4),
                "meters": round(val / 1000, 4),
            }

    return None


def run_ocr(image: np.ndarray) -> dict:
    """
    Returns labels, dimensions, and all_texts.
    """
    logger.info("== Stage 5: OCR Engine ==")
    results = _reader.readtext(image)

    labels = []
    dimensions = []
    all_texts = []

    for bbox, text, conf in results:
        if conf < 0.15:
            continue

        pts = np.array(bbox).astype(int)
        cx = int(np.mean(pts[:, 0]))
        cy = int(np.mean(pts[:, 1]))

        raw_text = text.strip()
        corrected_text = _correct_ocr_text(raw_text)

        entry = {
            "text": corrected_text,
            "original_text": raw_text,
            "x": cx,
            "y": cy,
            "bbox": pts.tolist(),
            "conf": round(float(conf), 3),
        }
        all_texts.append(entry)

        # ✅ First check if it's a dimension
        parsed = _parse_dimension(raw_text)
        if parsed:
            entry["parsed"] = parsed
            dimensions.append(entry)
            logger.info(
                f"    DIM: '{raw_text}' -> {parsed['feet']}ft"
                f"{' x ' + str(parsed.get('feet2', '')) + 'ft' if parsed.get('feet2') else ''}"
            )
        elif _is_dimension_text(raw_text):
            # Looks like dimension but didn't parse - try without spaces
            parsed2 = _parse_dimension(raw_text.replace(" ", ""))
            if parsed2:
                entry["parsed"] = parsed2
                dimensions.append(entry)
                logger.info(
                    f"    DIM (cleaned): '{raw_text}' -> {parsed2['feet']}ft"
                )
            else:
                labels.append(entry)
        else:
            labels.append(entry)

    logger.info(f"  Labels={len(labels)}  Dimensions={len(dimensions)}")
    return {
        "labels": labels,
        "dimensions": dimensions,
        "all_texts": all_texts,
    }