"""
Stage 8: Estimation Engine
Indian Residential Rates (INR)
"""

import logging

logger = logging.getLogger(__name__)

DEFAULT_RATES = {
    # Flooring (vitrified tiles + labour)
    "flooring_cost_per_sqft": 85.0,           # ₹85/sqft standard vitrified

    # Painting
    "wall_paint_cost_per_sqft": 18.0,          # ₹18/sqft wall painting
    "ceiling_paint_cost_per_sqft": 14.0,       # ₹14/sqft ceiling

    # Wall height
    "wall_height_ft": 10.0,                    # Standard Indian ceiling

    # Doors & Windows
    "door_unit_cost": 8500.0,                  # Flush door + frame
    "window_unit_cost": 6000.0,                # UPVC/aluminium window

    # Electrical
    "electrical_per_room": 5500.0,             # Basic wiring per room

    # Plumbing
    "plumbing_per_wet_room": 25000.0,

    # Wet room keywords
    "wet_room_keywords": [
        "bathroom", "kitchen", "toilet", "wc",
        "laundry", "utility", "wash", "bath",
        "kit", "washroom",
    ],

    "currency": "INR",
    "currency_symbol": "₹",
}


def estimate(rooms, total_doors, total_windows, rates=None):
    logger.info("== Stage 8: Estimation Engine ==")
    r = {**DEFAULT_RATES, **(rates or {})}

    room_estimates = []
    total_floor = 0.0
    total_paint = 0.0
    total_ceiling = 0.0
    total_electrical = 0.0
    total_plumbing = 0.0

    for room in rooms:
        area_sqft = room["area_sqft"]
        peri_ft = room["perimeter_ft"]
        wall_h = r["wall_height_ft"]

        floor_cost = area_sqft * r["flooring_cost_per_sqft"]
        wall_area_sqft = peri_ft * wall_h
        paint_cost = wall_area_sqft * r["wall_paint_cost_per_sqft"]
        ceiling_cost = area_sqft * r["ceiling_paint_cost_per_sqft"]
        elec = r["electrical_per_room"]

        label_lower = room["label"].lower()
        is_wet = any(kw in label_lower for kw in r["wet_room_keywords"])
        plumb = r["plumbing_per_wet_room"] if is_wet else 0.0

        room_total = floor_cost + paint_cost + ceiling_cost + elec + plumb

        room_estimates.append({
            "room_id": int(room["room_id"]),
            "label": str(room["label"]),
            "area_sqft": round(float(area_sqft), 2),
            "area_m2": round(float(room["area_m2"]), 2),
            "flooring_cost": round(float(floor_cost), 2),
            "wall_paint_area_sqft": round(float(wall_area_sqft), 2),
            "wall_paint_cost": round(float(paint_cost), 2),
            "ceiling_paint_cost": round(float(ceiling_cost), 2),
            "electrical_cost": round(float(elec), 2),
            "plumbing_cost": round(float(plumb), 2),
            "is_wet_room": bool(is_wet),
            "room_total": round(float(room_total), 2),
        })

        total_floor += floor_cost
        total_paint += paint_cost
        total_ceiling += ceiling_cost
        total_electrical += elec
        total_plumbing += plumb

    door_cost = total_doors * r["door_unit_cost"]
    window_cost = total_windows * r["window_unit_cost"]

    grand_total = (
        total_floor + total_paint + total_ceiling
        + total_electrical + total_plumbing
        + door_cost + window_cost
    )

    summary = {
        "currency": r["currency"],
        "currency_symbol": r["currency_symbol"],
        "total_area_sqft": round(sum(rm["area_sqft"] for rm in rooms), 2),
        "total_area_m2": round(sum(rm["area_m2"] for rm in rooms), 2),
        "total_flooring_cost": round(float(total_floor), 2),
        "total_wall_paint_cost": round(float(total_paint), 2),
        "total_ceiling_paint_cost": round(float(total_ceiling), 2),
        "total_electrical_cost": round(float(total_electrical), 2),
        "total_plumbing_cost": round(float(total_plumbing), 2),
        "total_doors": int(total_doors),
        "doors_cost": round(float(door_cost), 2),
        "total_windows": int(total_windows),
        "windows_cost": round(float(window_cost), 2),
        "grand_total_inr": round(float(grand_total), 2),
    }

    logger.info(f"  Grand Total: {r['currency_symbol']}{summary['grand_total_inr']:,.2f}")
    return {"rooms": room_estimates, "summary": summary}