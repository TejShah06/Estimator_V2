from pydantic import BaseModel
from typing import Optional


class EstimateCreate(BaseModel):
    area_sqft: float
    floors: int
    wastage_percent: float = 5

    steel_rate: float
    cement_rate: float
    sand_rate: float
    aggregate_rate: float
    brick_rate: float
    paint_rate: float

    # Custom ratio input
    cement_part: float
    sand_part: float
    aggregate_part: float