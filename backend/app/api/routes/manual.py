# app/api/routes/manual.py

from fastapi              import APIRouter, Depends, HTTPException, status
from fastapi.responses    import StreamingResponse
from sqlalchemy.orm       import Session
import logging

from app.api.deps                    import get_current_user, get_db
from app.models.user                 import User
from app.models.manual_estimation    import ManualEstimation
from app.schemas.manual_estimation   import ManualEstimationCreate
from app.services.manual_service     import (
    create_manual_estimation,
    get_manual_estimation_by_id,
    calculate_with_mix,
)
from app.services.pdf_service        import generate_manual_report_pdf
from app.services.subscription_service import check_pdf_permission

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/estimations/manual", tags=["Manual Estimations"])

@router.get(
    "",                           #GET /estimations/manual  (no trailing slash)
    summary="List My Estimations",
)
def list_estimations(
    skip:         int     = 0,
    limit:        int     = 20,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    """Get all manual estimations for the current user"""

    estimations = (
        db.query(ManualEstimation)
        .filter(
            ManualEstimation.user_id    == current_user.id,
            ManualEstimation.is_deleted == False,
        )
        .order_by(ManualEstimation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    total = (
        db.query(ManualEstimation)
        .filter(
            ManualEstimation.user_id    == current_user.id,
            ManualEstimation.is_deleted == False,
        )
        .count()
    )

    return {
        "total": total,
        "estimations": [
            {
                "id":               e.id,
                "estimation_code":  e.estimation_code,
                "estimation_name":  e.estimation_name,
                "area_sqft":        e.area_sqft,
                "floors":           e.floors,
                "mix_type":         e.mix_type,
                "total_cost":       sum(c.total_cost for c in e.costs) if e.costs else 0,
                "status":           e.status,
                "created_at":       e.created_at.isoformat() if e.created_at else None,
            }
            for e in estimations
        ],
    }


# ══════════════════════════════════════════════════════════════════════════════
# 2. CREATE NEW ESTIMATION
# ══════════════════════════════════════════════════════════════════════════════
@router.post(
    "",                           # POST /estimations/manual
    status_code=status.HTTP_201_CREATED,
    summary="Create Manual Estimation",
)
def create_estimation(
    estimation_data: ManualEstimationCreate,
    current_user:    User    = Depends(get_current_user),
    db:              Session = Depends(get_db),
):
    """
    Create a new manual estimation.
    Calculates all materials and costs, saves to DB.
    """
    try:
        logger.info(
            f"Creating estimation '{estimation_data.estimation_name}' "
            f"for user {current_user.id}"
        )

        estimation = create_manual_estimation(
            db=db,
            user_id=current_user.id,
            estimation_data=estimation_data,
        )

        logger.info(f"Estimation created: {estimation.estimation_code}")

        return {
            "id":               estimation.id,
            "estimation_code":  estimation.estimation_code,
            "estimation_name":  estimation.estimation_name,
            "description":      estimation.description,
            "area_sqft":        estimation.area_sqft,
            "area_m2":          estimation.area_m2,
            "floors":           estimation.floors,
            "wastage_percent":  estimation.wastage_percent,
            "mix_type":         estimation.mix_type,
            "concrete_volume_m3": estimation.concrete_volume_m3,
            "dry_volume_m3":    estimation.dry_volume_m3,
            "materials": {
                "steel_kg":      estimation.steel_kg,
                "cement_bags":   estimation.cement_bags,
                "sand_ton":      estimation.sand_ton,
                "aggregate_ton": estimation.aggregate_ton,
                "bricks":        estimation.bricks,
                "paint_liters":  estimation.paint_liters,
            },
            "costs": [
                {
                    "id":            cost.id,
                    "material_type": cost.material_type,
                    "quantity":      cost.quantity,
                    "unit":          cost.unit,
                    "rate_per_unit": cost.rate_per_unit,
                    "material_cost": cost.material_cost,
                    "wastage_cost":  cost.wastage_cost,
                    "total_cost":    cost.total_cost,
                }
                for cost in estimation.costs
            ],
            "total_cost": sum(c.total_cost for c in estimation.costs),
            "status":     estimation.status,
            "created_at": estimation.created_at.isoformat() if estimation.created_at else None,
        }

    except Exception as e:
        logger.error(f"Failed to create estimation: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create estimation: {str(e)}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# 3. GET ESTIMATION REPORT
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/{estimation_id}/report",   # GET /estimations/manual/{id}/report
    summary="Get Estimation Report",
)
def get_estimation_report(
    estimation_id: int,
    current_user:  User    = Depends(get_current_user),
    db:            Session = Depends(get_db),
):
    """Get detailed report of a single estimation"""

    try:
        estimation = get_manual_estimation_by_id(db, estimation_id, current_user.id)

        if not estimation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Estimation not found"
            )

        logger.info(f"Fetching report for estimation {estimation_id}")

        total_cost = sum(cost.total_cost for cost in estimation.costs)

        cost_breakdown = {
            cost.material_type: {
                "quantity":      cost.quantity,
                "unit":          cost.unit,
                "rate_per_unit": cost.rate_per_unit,
                "material_cost": cost.material_cost,
                "wastage_cost":  cost.wastage_cost,
                "total_cost":    cost.total_cost,
            }
            for cost in estimation.costs
        }

        return {
            "id":               estimation.id,
            "estimation_code":  estimation.estimation_code,
            "estimation_name":  estimation.estimation_name,
            "description":      estimation.description,
            "area_sqft":        estimation.area_sqft,
            "area_m2":          estimation.area_m2,
            "floors":           estimation.floors,
            "wastage_percent":  estimation.wastage_percent,
            "mix_type":         estimation.mix_type,
            "mix_ratio": {
                "cement":    estimation.cement_part,
                "sand":      estimation.sand_part,
                "aggregate": estimation.aggregate_part,
            },
            "concrete_volume_m3": estimation.concrete_volume_m3,
            "dry_volume_m3":      estimation.dry_volume_m3,
            "materials": {
                "steel_kg":      estimation.steel_kg,
                "cement_bags":   estimation.cement_bags,
                "sand_ton":      estimation.sand_ton,
                "aggregate_ton": estimation.aggregate_ton,
                "bricks":        estimation.bricks,
                "paint_liters":  estimation.paint_liters,
            },
            "rates": {
                "steel_per_kg":      estimation.steel_rate_per_kg,
                "cement_per_bag":    estimation.cement_rate_per_bag,
                "sand_per_ton":      estimation.sand_rate_per_ton,
                "aggregate_per_ton": estimation.aggregate_rate_per_ton,
                "brick_per_unit":    estimation.brick_rate_per_unit,
                "paint_per_liter":   estimation.paint_rate_per_liter,
            },
            "cost_breakdown": cost_breakdown,
            "total_cost":     round(total_cost, 2),
            "status":         estimation.status,
            "created_at":     estimation.created_at.isoformat() if estimation.created_at else None,
            "updated_at":     estimation.updated_at.isoformat() if estimation.updated_at else None,

            #  Also include costs array for frontend chart
            "costs": [
                {
                    "material_type": c.material_type,
                    "total_cost":    c.total_cost,
                }
                for c in estimation.costs
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching estimation report: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching report: {str(e)}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# 4. DOWNLOAD PDF REPORT
# ══════════════════════════════════════════════════════════════════════════════
@router.get(
    "/{estimation_id}/download-pdf",  
    summary="Download Estimation PDF",
)
async def download_manual_report_pdf(
    estimation_id: int,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    """
    Download manual estimation report as PDF.
    Available on all plans including Basic (Free).
    """

    # ── Check PDF permission ───────────────────────────────────────────────
    allowed = check_pdf_permission(db, current_user.id, "manual")

    if not allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "error":            "permission_denied",
                "message":          "You don't have permission to download this report.",
                "upgrade_required": False,
            }
        )

    # ── Fetch estimation ───────────────────────────────────────────────────
    estimation = db.query(ManualEstimation).filter(
        ManualEstimation.id         == estimation_id,
        ManualEstimation.user_id    == current_user.id,
        ManualEstimation.is_deleted == False,
    ).first()

    if not estimation:
        raise HTTPException(status_code=404, detail="Estimation not found")

    # ── Build report dict ──────────────────────────────────────────────────
    costs      = estimation.costs or []
    total_cost = sum(c.total_cost for c in costs) if costs else 0

    report = {
        "estimation_code":  estimation.estimation_code,
        "estimation_name":  estimation.estimation_name,
        "area_sqft":        estimation.area_sqft        or 0,
        "area_m2":          estimation.area_m2          or 0,
        "floors":           estimation.floors           or 1,
        "mix_type":         estimation.mix_type,
        "wastage_percent":  estimation.wastage_percent  or 0,

        "mix_ratio": {
            "cement":    estimation.cement_part,
            "sand":      estimation.sand_part,
            "aggregate": estimation.aggregate_part,
        } if estimation.cement_part else None,

        "concrete_volume_m3": estimation.concrete_volume_m3,
        "dry_volume_m3":      estimation.dry_volume_m3,

        "materials": {
            "steel_kg":      estimation.steel_kg,
            "cement_bags":   estimation.cement_bags,
            "sand_ton":      estimation.sand_ton,
            "aggregate_ton": estimation.aggregate_ton,
            "bricks":        estimation.bricks,
            "paint_liters":  estimation.paint_liters,
        },

        "rates": {
            "steel_per_kg":      estimation.steel_rate_per_kg,
            "cement_per_bag":    estimation.cement_rate_per_bag,
            "sand_per_ton":      estimation.sand_rate_per_ton,
            "aggregate_per_ton": estimation.aggregate_rate_per_ton,
            "brick_per_unit":    estimation.brick_rate_per_unit,
            "paint_per_liter":   estimation.paint_rate_per_liter,
        },

        "costs": [
            {
                "material_type": c.material_type,
                "total_cost":    c.total_cost,
            }
            for c in costs
        ],

        "total_cost": total_cost,
    }

    # ── Generate and stream PDF ────────────────────────────────────────────
    pdf_buffer = generate_manual_report_pdf(report)

    filename = (
        f"Manual_Report_{estimation.estimation_name or estimation_id}.pdf"
        .replace(" ", "_")
        .replace("/", "-")
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# ══════════════════════════════════════════════════════════════════════════════
# 5. DELETE ESTIMATION (soft delete)
# ══════════════════════════════════════════════════════════════════════════════
@router.delete(
    "/{estimation_id}",          # ✅ DELETE /estimations/manual/{id}
    summary="Delete Estimation",
)
def delete_estimation(
    estimation_id: int,
    current_user:  User    = Depends(get_current_user),
    db:            Session = Depends(get_db),
):
    """Soft delete a manual estimation"""

    estimation = db.query(ManualEstimation).filter(
        ManualEstimation.id         == estimation_id,
        ManualEstimation.user_id    == current_user.id,
        ManualEstimation.is_deleted == False,
    ).first()

    if not estimation:
        raise HTTPException(status_code=404, detail="Estimation not found")

    from datetime import datetime
    estimation.is_deleted = True
    estimation.deleted_at = datetime.utcnow()
    db.commit()

    logger.info(f"Estimation {estimation_id} deleted by user {current_user.id}")

    return {"message": "Estimation deleted successfully", "id": estimation_id}