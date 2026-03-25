from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.estimate import Estimate
from app.schemas.estimate_schema import EstimateCreate
from app.services.calculator_services import (
    calculate_m20,
    calculate_m25,
    calculate_custom_mix
)

from app.api.deps import get_current_user

router = APIRouter(prefix="/calculator", tags=["Calculator"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def calculate_estimate(
    data: EstimateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    base_data = {
        "area_sqft": data.area_sqft,
        "floors": data.floors,
        "wastage_percent": data.wastage_percent,
        "steel_rate": data.steel_rate,
        "cement_rate": data.cement_rate,
        "sand_rate": data.sand_rate,
        "aggregate_rate": data.aggregate_rate,
        "brick_rate": data.brick_rate,
        "paint_rate": data.paint_rate,
    }

    # Calculate mixes
    m20_result = calculate_m20(**base_data)

    m25_result = calculate_m25(**base_data)

    custom_result = calculate_custom_mix(
        cement_part=data.cement_part,
        sand_part=data.sand_part,
        aggregate_part=data.aggregate_part,
        **base_data
    )

    # Save estimate
    new_estimate = Estimate(
        area_sqft=data.area_sqft,
        floors=data.floors,
        wastage_percent=data.wastage_percent,
        mix_type="comparison",
        total_cost=custom_result["total_cost"],
        user_id=current_user.id
    )

    db.add(new_estimate)
    db.commit()
    db.refresh(new_estimate)

    return {
        "m20": m20_result,
        "m25": m25_result,
        "custom": custom_result
    }