
from sqlalchemy.orm import Session
from app.models.manual_estimation import ManualEstimation, ManualEstimationCost  
from app.schemas.manual_estimation import ManualEstimationCreate
import uuid

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
    Returns dict with materials and costs.
    """

    # STEP 1 — TOTAL BUILT-UP AREA
    total_area = area_sqft * floors

    # STEP 2 — CONCRETE VOLUME
    concrete_m3 = total_area * 0.045
    dry_volume = concrete_m3 * 1.54

    # STEP 3 — MIX RATIO DISTRIBUTION
    total_parts = cement_part + sand_part + aggregate_part

    cement_m3 = (cement_part / total_parts) * dry_volume
    sand_m3 = (sand_part / total_parts) * dry_volume
    aggregate_m3 = (aggregate_part / total_parts) * dry_volume

    # STEP 4 — UNIT CONVERSIONS
    cement_bags = cement_m3 / 0.035
    sand_ton = sand_m3 * 1600 / 1000
    aggregate_ton = aggregate_m3 * 1450 / 1000

    steel_kg = total_area * 3.5
    steel_ton = steel_kg / 1000

    bricks = total_area * 8
    paint_liters = total_area / 2.5

    # STEP 5 — APPLY WASTAGE
    factor = 1 + wastage_percent / 100

    cement_bags *= factor
    sand_ton *= factor
    aggregate_ton *= factor
    steel_kg *= factor
    steel_ton *= factor
    bricks *= factor
    paint_liters *= factor

    # STEP 6 — COST CALCULATION
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

    # RETURN STRUCTURED RESPONSE
    return {
        "concrete_volume_m3": round(concrete_m3, 3),
        "dry_volume_m3": round(dry_volume, 3),
        "materials": {
            "steel_kg": round(steel_kg, 2),
            "cement_bags": round(cement_bags, 2),
            "sand_ton": round(sand_ton, 2),
            "aggregate_ton": round(aggregate_ton, 2),
            "bricks": round(bricks, 2),
            "paint_liters": round(paint_liters, 2),
        },
        "cost_breakdown": {
            "steel": {
                "quantity": round(steel_kg, 2),
                "unit": "kg",
                "rate": steel_rate,
                "material_cost": round(steel_cost * (1 - wastage_percent/100), 2),
                "wastage_cost": round(steel_cost * (wastage_percent/100), 2),
                "total": round(steel_cost, 2),
            },
            "cement": {
                "quantity": round(cement_bags, 2),
                "unit": "bags",
                "rate": cement_rate,
                "material_cost": round(cement_cost * (1 - wastage_percent/100), 2),
                "wastage_cost": round(cement_cost * (wastage_percent/100), 2),
                "total": round(cement_cost, 2),
            },
            "sand": {
                "quantity": round(sand_ton, 2),
                "unit": "ton",
                "rate": sand_rate,
                "material_cost": round(sand_cost * (1 - wastage_percent/100), 2),
                "wastage_cost": round(sand_cost * (wastage_percent/100), 2),
                "total": round(sand_cost, 2),
            },
            "aggregate": {
                "quantity": round(aggregate_ton, 2),
                "unit": "ton",
                "rate": aggregate_rate,
                "material_cost": round(aggregate_cost * (1 - wastage_percent/100), 2),
                "wastage_cost": round(aggregate_cost * (wastage_percent/100), 2),
                "total": round(aggregate_cost, 2),
            },
            "brick": {
                "quantity": round(bricks, 2),
                "unit": "unit",
                "rate": brick_rate,
                "material_cost": round(brick_cost * (1 - wastage_percent/100), 2),
                "wastage_cost": round(brick_cost * (wastage_percent/100), 2),
                "total": round(brick_cost, 2),
            },
            "paint": {
                "quantity": round(paint_liters, 2),
                "unit": "liters",
                "rate": paint_rate,
                "material_cost": round(paint_cost * (1 - wastage_percent/100), 2),
                "wastage_cost": round(paint_cost * (wastage_percent/100), 2),
                "total": round(paint_cost, 2),
            },
        },
        "total_cost": round(total_cost, 2),
    }


def create_manual_estimation(
    db: Session,
    user_id: int,
    estimation_data: ManualEstimationCreate,
) -> ManualEstimation:
    """
    Create manual estimation in database with complete cost breakdown.
    """
    
    # Calculate all materials and costs
    calculation = calculate_with_mix(
        area_sqft=estimation_data.area_sqft,
        floors=estimation_data.floors,
        wastage_percent=estimation_data.wastage_percent,
        cement_part=estimation_data.cement_part,
        sand_part=estimation_data.sand_part,
        aggregate_part=estimation_data.aggregate_part,
        steel_rate=estimation_data.steel_rate_per_kg,
        cement_rate=estimation_data.cement_rate_per_bag,
        sand_rate=estimation_data.sand_rate_per_ton,
        aggregate_rate=estimation_data.aggregate_rate_per_ton,
        brick_rate=estimation_data.brick_rate_per_unit,
        paint_rate=estimation_data.paint_rate_per_liter,
    )

    # Generate unique code
    estimation_code = f"EST_{uuid.uuid4().hex[:8].upper()}"

    # Create main estimation record
    estimation = ManualEstimation(
        user_id=user_id,
        estimation_code=estimation_code,
        estimation_name=estimation_data.estimation_name,
        description=estimation_data.description,
        area_sqft=estimation_data.area_sqft,
        area_m2=estimation_data.area_sqft / 10.764,  # Convert to m2
        floors=estimation_data.floors,
        wastage_percent=estimation_data.wastage_percent,
        mix_type=estimation_data.mix_type,
        cement_part=estimation_data.cement_part,
        sand_part=estimation_data.sand_part,
        aggregate_part=estimation_data.aggregate_part,
        steel_rate_per_kg=estimation_data.steel_rate_per_kg,
        cement_rate_per_bag=estimation_data.cement_rate_per_bag,
        sand_rate_per_ton=estimation_data.sand_rate_per_ton,
        aggregate_rate_per_ton=estimation_data.aggregate_rate_per_ton,
        brick_rate_per_unit=estimation_data.brick_rate_per_unit,
        paint_rate_per_liter=estimation_data.paint_rate_per_liter,
        concrete_volume_m3=calculation["concrete_volume_m3"],
        dry_volume_m3=calculation["dry_volume_m3"],
        steel_kg=calculation["materials"]["steel_kg"],
        cement_bags=calculation["materials"]["cement_bags"],
        sand_ton=calculation["materials"]["sand_ton"],
        aggregate_ton=calculation["materials"]["aggregate_ton"],
        bricks=calculation["materials"]["bricks"],
        paint_liters=calculation["materials"]["paint_liters"],
        status="completed",
    )

    db.add(estimation)
    db.flush()  # Get the estimation ID

    # Create cost breakdown records
    cost_data = calculation["cost_breakdown"]
    
    materials = [
        ("steel", cost_data["steel"]),
        ("cement", cost_data["cement"]),
        ("sand", cost_data["sand"]),
        ("aggregate", cost_data["aggregate"]),
        ("brick", cost_data["brick"]),
        ("paint", cost_data["paint"]),
    ]

    for material_type, cost_info in materials:
        cost_record = ManualEstimationCost(
            estimation_id=estimation.id,
            material_type=material_type,
            quantity=cost_info["quantity"],
            unit=cost_info["unit"],
            rate_per_unit=cost_info["rate"],
            material_cost=cost_info["material_cost"],
            wastage_cost=cost_info["wastage_cost"],
            total_cost=cost_info["total"],
        )
        db.add(cost_record)

    db.commit()
    db.refresh(estimation)
    
    return estimation


def get_manual_estimation_by_id(db: Session, estimation_id: int, user_id: int):
    """Get specific estimation (verify ownership)"""
    return db.query(ManualEstimation).filter(
        ManualEstimation.id == estimation_id,
        ManualEstimation.user_id == user_id,
        ManualEstimation.is_deleted == False
    ).first()