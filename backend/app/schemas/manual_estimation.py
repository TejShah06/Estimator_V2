from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ManualEstimationCostResponse(BaseModel):
    id: int
    material_type: str
    quantity: float
    unit: str
    rate_per_unit: float
    material_cost: float
    wastage_cost: float
    total_cost: float

    class Config:
        from_attributes = True


class ManualEstimationCreate(BaseModel):
    """Request body for creating manual estimation"""
    estimation_name: str
    description: Optional[str] = None
    
    # Input data
    area_sqft: float
    floors: int
    wastage_percent: float = 5.0
    
    # Mix configuration
    mix_type: str  # "M20", "M25", "CUSTOM"
    cement_part: float
    sand_part: float
    aggregate_part: float
    
    # Rates
    steel_rate_per_kg: float
    cement_rate_per_bag: float
    sand_rate_per_ton: float
    aggregate_rate_per_ton: float
    brick_rate_per_unit: float
    paint_rate_per_liter: float


class ManualEstimationUpdate(BaseModel):
    """Request body for updating estimation"""
    estimation_name: Optional[str] = None
    description: Optional[str] = None
    area_sqft: Optional[float] = None
    floors: Optional[int] = None
    wastage_percent: Optional[float] = None
    
    # Rates can be updated
    steel_rate_per_kg: Optional[float] = None
    cement_rate_per_bag: Optional[float] = None
    sand_rate_per_ton: Optional[float] = None
    aggregate_rate_per_ton: Optional[float] = None
    brick_rate_per_unit: Optional[float] = None
    paint_rate_per_liter: Optional[float] = None


class ManualEstimationResponse(BaseModel):
    """Response body for single estimation"""
    id: int
    estimation_code: str
    estimation_name: str
    description: Optional[str]
    
    # Input data
    area_sqft: float
    area_m2: Optional[float]
    floors: int
    wastage_percent: float
    
    # Mix
    mix_type: str
    cement_part: float
    sand_part: float
    aggregate_part: float
    
    # Materials calculated
    concrete_volume_m3: Optional[float]
    dry_volume_m3: Optional[float]
    steel_kg: Optional[float]
    cement_bags: Optional[float]
    sand_ton: Optional[float]
    aggregate_ton: Optional[float]
    bricks: Optional[float]
    paint_liters: Optional[float]
    
    # Costs
    costs: List[ManualEstimationCostResponse]
    total_cost: float
    
    # Metadata
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ManualEstimationListResponse(BaseModel):
    """Response for list of estimations"""
    id: int
    estimation_code: str
    estimation_name: str
    area_sqft: float
    floors: int
    mix_type: str
    total_cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True