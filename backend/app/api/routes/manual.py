from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.manual_estimation import ManualEstimationCreate
from app.services.manual_service import (
    create_manual_estimation,
    get_manual_estimation_by_id,
    calculate_with_mix,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/estimations/manual", tags=["Manual Estimations"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create Manual Estimation",
    description="Calculate and save estimation from form data"
)
def create_estimation(
    estimation_data: ManualEstimationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new manual estimation.
    
    Takes form data from frontend, calculates all materials and costs,
    saves to database, and returns the estimation with all details.
    
    **Request Body Example:**
    ```json
    {
        "estimation_name": "House A - Ground Floor",
        "description": "2BHK residential construction",
        "area_sqft": 1500,
        "floors": 1,
        "wastage_percent": 5,
        "mix_type": "M20",
        "cement_part": 1,
        "sand_part": 1.5,
        "aggregate_part": 3,
        "steel_rate_per_kg": 50,
        "cement_rate_per_bag": 300,
        "sand_rate_per_ton": 500,
        "aggregate_rate_per_ton": 800,
        "brick_rate_per_unit": 15,
        "paint_rate_per_liter": 200
    }
    ```
    
    **Response:** Estimation with ID and all calculated details
    """
    try:
        logger.info(f"Creating estimation '{estimation_data.estimation_name}' for user {current_user.id}")
        
        estimation = create_manual_estimation(
            db=db,
            user_id=current_user.id,
            estimation_data=estimation_data,
        )
        
        logger.info(f"Estimation created: {estimation.estimation_code}")
        
        return {
            "id": estimation.id,
            "estimation_code": estimation.estimation_code,
            "estimation_name": estimation.estimation_name,
            "description": estimation.description,
            "area_sqft": estimation.area_sqft,
            "area_m2": estimation.area_m2,
            "floors": estimation.floors,
            "wastage_percent": estimation.wastage_percent,
            "mix_type": estimation.mix_type,
            "concrete_volume_m3": estimation.concrete_volume_m3,
            "dry_volume_m3": estimation.dry_volume_m3,
            "materials": {
                "steel_kg": estimation.steel_kg,
                "cement_bags": estimation.cement_bags,
                "sand_ton": estimation.sand_ton,
                "aggregate_ton": estimation.aggregate_ton,
                "bricks": estimation.bricks,
                "paint_liters": estimation.paint_liters,
            },
            "costs": [
                {
                    "id": cost.id,
                    "material_type": cost.material_type,
                    "quantity": cost.quantity,
                    "unit": cost.unit,
                    "rate_per_unit": cost.rate_per_unit,
                    "material_cost": cost.material_cost,
                    "wastage_cost": cost.wastage_cost,
                    "total_cost": cost.total_cost,
                }
                for cost in estimation.costs
            ],
            "total_cost": sum(c.total_cost for c in estimation.costs),
            "status": estimation.status,
            "created_at": estimation.created_at.isoformat() if estimation.created_at else None,
        }
        
    except Exception as e:
        logger.error(f"Failed to create estimation: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create estimation: {str(e)}"
        )


@router.get(
    "/{estimation_id}/report",
    summary="Get Estimation Report",
    description="Get detailed report of estimation (like floorplan /report endpoint)"
)
def get_estimation_report(
    estimation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed estimation report for dashboard/display.
    
    Similar to floorplan /report endpoint, returns all estimation details
    in a format ready for frontend display.
    
    **Path Parameters:**
    - estimation_id: int
    
    **Response:** Complete estimation report with all materials and costs
    """
    try:
        estimation = get_manual_estimation_by_id(db, estimation_id, current_user.id)
        
        if not estimation:
            logger.warning(f"Estimation {estimation_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Estimation not found"
            )
        
        logger.info(f"Fetching report for estimation {estimation_id}")
        
        # Calculate total cost
        total_cost = sum(cost.total_cost for cost in estimation.costs)
        
        # Cost breakdown by material
        cost_breakdown = {
            cost.material_type: {
                "quantity": cost.quantity,
                "unit": cost.unit,
                "rate_per_unit": cost.rate_per_unit,
                "material_cost": cost.material_cost,
                "wastage_cost": cost.wastage_cost,
                "total_cost": cost.total_cost,
            }
            for cost in estimation.costs
        }
        
        return {
            "id": estimation.id,
            "estimation_code": estimation.estimation_code,
            "estimation_name": estimation.estimation_name,
            "description": estimation.description,
            
            # Building info
            "area_sqft": estimation.area_sqft,
            "area_m2": estimation.area_m2,
            "floors": estimation.floors,
            "wastage_percent": estimation.wastage_percent,
            
            # Mix details
            "mix_type": estimation.mix_type,
            "mix_ratio": {
                "cement": estimation.cement_part,
                "sand": estimation.sand_part,
                "aggregate": estimation.aggregate_part,
            },
            
            # Calculations
            "concrete_volume_m3": estimation.concrete_volume_m3,
            "dry_volume_m3": estimation.dry_volume_m3,
            
            # Materials
            "materials": {
                "steel_kg": estimation.steel_kg,
                "cement_bags": estimation.cement_bags,
                "sand_ton": estimation.sand_ton,
                "aggregate_ton": estimation.aggregate_ton,
                "bricks": estimation.bricks,
                "paint_liters": estimation.paint_liters,
            },
            
            # Rates used
            "rates": {
                "steel_per_kg": estimation.steel_rate_per_kg,
                "cement_per_bag": estimation.cement_rate_per_bag,
                "sand_per_ton": estimation.sand_rate_per_ton,
                "aggregate_per_ton": estimation.aggregate_rate_per_ton,
                "brick_per_unit": estimation.brick_rate_per_unit,
                "paint_per_liter": estimation.paint_rate_per_liter,
            },
            
            # Cost breakdown
            "cost_breakdown": cost_breakdown,
            "total_cost": round(total_cost, 2),
            
            # Metadata
            "status": estimation.status,
            "created_at": estimation.created_at.isoformat() if estimation.created_at else None,
            "updated_at": estimation.updated_at.isoformat() if estimation.updated_at else None,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching estimation report: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching report: {str(e)}"
        )