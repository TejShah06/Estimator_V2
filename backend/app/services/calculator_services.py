# ==========================================================
# AI SMART CONSTRUCTION ESTIMATOR — SERVICE LAYER
# ==========================================================
# This service handles:
# 1. M20 Mix (1:1.5:3)
# 2. M25 Mix (1:1:2)
# 3. Custom Mix
# Returns structured JSON response for API
# ==========================================================


def calculate_with_mix(
    area_sqft: float,
    floors: int,
    wastage_percent: float,
    cement_part: float,
    sand_part: float,
    aggregate_part: float,
    steel_rate: float,
    cement_rate: float,
    sand_rate: float,
    aggregate_rate: float,
    brick_rate: float,
    paint_rate: float,
):
    """
    Core calculation logic based on concrete mix ratio.
    """

    # --------------------------------------------------
    # STEP 1 — TOTAL BUILT-UP AREA
    # --------------------------------------------------
    total_area = area_sqft * floors

    # --------------------------------------------------
    # STEP 2 — CONCRETE VOLUME
    # --------------------------------------------------
    concrete_m3 = total_area * 0.045
    dry_volume = concrete_m3 * 1.54

    # --------------------------------------------------
    # STEP 3 — MIX RATIO DISTRIBUTION
    # --------------------------------------------------
    total_parts = cement_part + sand_part + aggregate_part

    cement_m3 = (cement_part / total_parts) * dry_volume
    sand_m3 = (sand_part / total_parts) * dry_volume
    aggregate_m3 = (aggregate_part / total_parts) * dry_volume

    # --------------------------------------------------
    # STEP 4 — UNIT CONVERSIONS
    # --------------------------------------------------
    cement_bags = cement_m3 / 0.035
    sand_ton = sand_m3 * 1600 / 1000
    aggregate_ton = aggregate_m3 * 1450 / 1000

    steel_kg = total_area * 3.5
    steel_ton = steel_kg / 1000

    bricks = total_area * 8
    paint_liters = total_area / 2.5

    # --------------------------------------------------
    # STEP 5 — APPLY WASTAGE
    # --------------------------------------------------
    factor = 1 + wastage_percent / 100

    cement_bags *= factor
    sand_ton *= factor
    aggregate_ton *= factor
    steel_kg *= factor
    steel_ton *= factor
    bricks *= factor
    paint_liters *= factor

    # --------------------------------------------------
    # STEP 6 — COST CALCULATION
    # --------------------------------------------------
    steel_cost = steel_kg * steel_rate
    cement_cost = cement_bags * cement_rate
    sand_cost = sand_ton * sand_rate
    aggregate_cost = aggregate_ton * aggregate_rate
    brick_cost = bricks * brick_rate
    paint_cost = paint_liters * paint_rate

    total_cost = (
        steel_cost
        + cement_cost
        + sand_cost
        + aggregate_cost
        + brick_cost
        + paint_cost
    )

    # --------------------------------------------------
    # RETURN STRUCTURED RESPONSE
    # --------------------------------------------------
    return {
        "materials": {
            "steel_kg": round(steel_kg, 2),
            "cement_bags": round(cement_bags, 2),
            "sand_ton": round(sand_ton, 2),
            "aggregate_ton": round(aggregate_ton, 2),
            "bricks": round(bricks, 2),
            "paint_liters": round(paint_liters, 2),
        },
        "cost_breakdown": {
            "steel_cost": round(steel_cost, 2),
            "cement_cost": round(cement_cost, 2),
            "sand_cost": round(sand_cost, 2),
            "aggregate_cost": round(aggregate_cost, 2),
            "brick_cost": round(brick_cost, 2),
            "paint_cost": round(paint_cost, 2),
        },
        "total_cost": round(total_cost, 2),
    }


# ==========================================================
# PREDEFINED MIXES
# ==========================================================

def calculate_m20(**kwargs):
    """M20 Mix (1:1.5:3)"""
    return calculate_with_mix(
        cement_part=1,
        sand_part=1.5,
        aggregate_part=3,
        **kwargs
    )


def calculate_m25(**kwargs):
    """M25 Mix (1:1:2)"""
    return calculate_with_mix(
        cement_part=1,
        sand_part=1,
        aggregate_part=2,
        **kwargs
    )


def calculate_custom_mix(
    cement_part: float,
    sand_part: float,
    aggregate_part: float,
    **kwargs
):
    """Engineer Custom Mix"""
    return calculate_with_mix(
        cement_part=cement_part,
        sand_part=sand_part,
        aggregate_part=aggregate_part,
        **kwargs
    )