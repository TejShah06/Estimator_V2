# app/api/routes/subscription.py

import razorpay
import hmac
import hashlib
import os
import math
from datetime import datetime, timedelta
from fastapi        import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic       import BaseModel
from app.api.deps           import get_db, get_current_user
from app.models.user        import User
from app.models.subscription_plan  import SubscriptionPlan
from app.models.user_subscription  import UserSubscription
from app.models.payment_history    import PaymentHistory
from app.services.subscription_service import (
    get_user_subscription,
    check_usage_limit,
    check_pdf_permission,
    seed_plans,
    assign_free_plan,
)

router = APIRouter(prefix="/subscription", tags=["Subscription"])


# ══════════════════════════════════════════════════════════════════════════════
# RAZORPAY CLIENT
# ══════════════════════════════════════════════════════════════════════════════
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID",     "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ══════════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════
class CreateOrderRequest(BaseModel):
    plan_name:     str   # advanced | extreme
    billing_cycle: str   # monthly  | yearly


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str
    plan_name:           str
    billing_cycle:       str


# ══════════════════════════════════════════════════════════════════════════════
# HELPER — CALCULATE UPGRADE / PRORATED PRICE
# ══════════════════════════════════════════════════════════════════════════════
def calculate_upgrade_price(
    db:            Session,
    user_id:       int,
    new_plan_name: str,
    billing_cycle: str,
) -> dict:
    """
    Calculate the smart upgrade price for a user.

    Rules:
    - If user is on Basic (free)  → full new plan price
    - If user is on a paid plan   → credit unused days pro-rated
    - If user is on trial         → full new plan price (trial is free)
    - Minimum charge is ₹1

    Returns:
        {
            new_plan_price, credit, final_price,
            description, new_plan, billing_cycle
        }
    """
    # Get current subscription
    current_sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == user_id
    ).first()

    # Get new plan
    new_plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.name == new_plan_name
    ).first()

    if not new_plan:
        return None

    # New plan full price
    new_price = (
        new_plan.yearly_price
        if billing_cycle == "yearly"
        else new_plan.monthly_price
    )

    # Default — no credit
    credit      = 0.0
    description = f"New {new_plan.display_name} ({billing_cycle}) subscription"

    # Calculate pro-rated credit from existing paid plan
    if current_sub and current_sub.plan:
        current_plan = current_sub.plan
        can_credit = (
            current_plan.name  != "basic"   and  # not free plan
            current_sub.status == "active"  and  # active (not trial/cancelled)
            current_sub.ends_at is not None and  # has expiry date
            not current_sub.is_trial             # not a trial
        )

        if can_credit:
            now     = datetime.utcnow()
            ends_at = current_sub.ends_at.replace(tzinfo=None)

            if ends_at > now:
                total_days     = 30 if current_sub.billing_cycle == "monthly" else 365
                remaining_days = (ends_at - now).days

                if remaining_days > 0:
                    current_price = (
                        current_plan.yearly_price
                        if current_sub.billing_cycle == "yearly"
                        else current_plan.monthly_price
                    )

                    # Pro-rated credit
                    credit = round(
                        (current_price / total_days) * remaining_days, 2
                    )

                    description = (
                        f"Upgrade from {current_plan.display_name} to "
                        f"{new_plan.display_name} ({billing_cycle}). "
                        f"Credit: ₹{credit:.0f} for {remaining_days} remaining days."
                    )

    # Final price — minimum ₹1
    final_price = max(1.0, round(new_price - credit, 2))

    return {
        "new_plan_price": new_price,
        "credit":         credit,
        "final_price":    final_price,
        "description":    description,
        "new_plan":       new_plan.display_name,
        "billing_cycle":  billing_cycle,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 1. GET ALL PLANS
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans (public endpoint)"""

    seed_plans(db)  # Create defaults if they don't exist

    plans = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.is_active == True
    ).all()

    return {
        "plans":           [p.to_dict() for p in plans],
        "razorpay_key_id": RAZORPAY_KEY_ID,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 2. GET CURRENT USER SUBSCRIPTION + USAGE + PERMISSIONS
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/my-plan")
def get_my_plan(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Get current user's subscription details, usage counters and permissions"""

    subscription  = get_user_subscription(db, current_user.id)
    ai_usage      = check_usage_limit(db, current_user.id, "ai_analysis")
    three_d_usage = check_usage_limit(db, current_user.id, "three_d")

    return {
        "subscription": subscription.to_dict(),
        "usage": {
            "ai_analysis": {
                "current": ai_usage["current"],
                "limit":   ai_usage["limit"],
            },
            "three_d": {
                "current": three_d_usage["current"],
                "limit":   three_d_usage["limit"],
            },
        },
        "permissions": {
            "can_download_ai_pdf":     subscription.plan.can_download_ai_pdf,
            "can_download_manual_pdf": subscription.plan.can_download_manual_pdf,
            "can_download_3d_glb":     subscription.plan.can_download_3d_glb,
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# 3. PREVIEW UPGRADE PRICE (before payment)
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/preview-upgrade")
def preview_upgrade(
    data:         CreateOrderRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Preview the upgrade price before opening Razorpay.
    Shows original price, pro-rated credit, and final amount to pay.
    """

    if data.plan_name == "basic":
        raise HTTPException(
            status_code=400,
            detail="Cannot purchase free plan"
        )

    result = calculate_upgrade_price(
        db            = db,
        user_id       = current_user.id,
        new_plan_name = data.plan_name,
        billing_cycle = data.billing_cycle,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Plan not found")

    return result


# ══════════════════════════════════════════════════════════════════════════════
# 4. CREATE RAZORPAY ORDER (with smart upgrade pricing)
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/create-order")
def create_order(
    data:         CreateOrderRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Create a Razorpay order with smart pro-rated upgrade pricing.
    Users upgrading from an existing paid plan only pay the difference.
    """

    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.name == data.plan_name
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if plan.name == "basic":
        raise HTTPException(status_code=400, detail="Cannot purchase free plan")

    # Calculate smart upgrade price
    pricing = calculate_upgrade_price(
        db            = db,
        user_id       = current_user.id,
        new_plan_name = data.plan_name,
        billing_cycle = data.billing_cycle,
    )

    if not pricing:
        raise HTTPException(status_code=404, detail="Plan pricing not found")

    # Razorpay uses paise (1 INR = 100 paise), minimum 100 paise = ₹1
    amount = max(100, int(pricing["final_price"] * 100))

    try:
        order = razorpay_client.order.create({
            "amount":   amount,
            "currency": "INR",
            "receipt":  f"order_{current_user.id}_{int(datetime.utcnow().timestamp())}",
            "notes": {
                "user_id":        str(current_user.id),
                "plan_name":      data.plan_name,
                "billing_cycle":  data.billing_cycle,
                "credit":         str(pricing["credit"]),
                "original_price": str(pricing["new_plan_price"]),
            },
        })

        # Record in payment history
        payment = PaymentHistory(
            user_id           = current_user.id,
            razorpay_order_id = order["id"],
            amount            = pricing["final_price"],
            currency          = "INR",
            billing_cycle     = data.billing_cycle,
            plan_name         = data.plan_name,
            status            = "created",
        )
        db.add(payment)
        db.commit()

        return {
            "order_id":        order["id"],
            "amount":          amount,
            "currency":        "INR",
            "razorpay_key_id": RAZORPAY_KEY_ID,
            "plan_name":       data.plan_name,
            "billing_cycle":   data.billing_cycle,
            "pricing": {
                "original_price": pricing["new_plan_price"],
                "credit":         pricing["credit"],
                "final_price":    pricing["final_price"],
                "description":    pricing["description"],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Razorpay order: {str(e)}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# 5. VERIFY PAYMENT & ACTIVATE SUBSCRIPTION
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/verify-payment")
def verify_payment(
    data:         VerifyPaymentRequest,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Verify Razorpay payment signature and activate / upgrade subscription.
    Signature is verified using HMAC-SHA256 before any DB changes.
    """

    # ── Step 1: Verify Razorpay signature ────────────────────────────────────
    try:
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        if generated_signature != data.razorpay_signature:
            raise HTTPException(
                status_code=400,
                detail="Invalid payment signature"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Signature verification failed: {str(e)}"
        )

    # ── Step 2: Get plan ──────────────────────────────────────────────────────
    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.name == data.plan_name
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # ── Step 3: Set subscription dates ───────────────────────────────────────
    starts_at = datetime.utcnow()
    ends_at   = (
        starts_at + timedelta(days=365)
        if data.billing_cycle == "yearly"
        else starts_at + timedelta(days=30)
    )

    # ── Step 4: Update or create subscription ────────────────────────────────
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id
    ).first()

    if subscription:
        subscription.plan_id                  = plan.id
        subscription.billing_cycle            = data.billing_cycle
        subscription.status                   = "active"
        subscription.is_trial                 = False
        subscription.trial_ends_at            = None
        subscription.starts_at                = starts_at
        subscription.ends_at                  = ends_at
        subscription.razorpay_order_id        = data.razorpay_order_id
        subscription.razorpay_subscription_id = data.razorpay_payment_id
    else:
        subscription = UserSubscription(
            user_id                   = current_user.id,
            plan_id                   = plan.id,
            billing_cycle             = data.billing_cycle,
            status                    = "active",
            is_trial                  = False,
            starts_at                 = starts_at,
            ends_at                   = ends_at,
            razorpay_order_id         = data.razorpay_order_id,
            razorpay_subscription_id  = data.razorpay_payment_id,
        )
        db.add(subscription)

    # ── Step 5: Mark payment as paid ─────────────────────────────────────────
    payment = db.query(PaymentHistory).filter(
        PaymentHistory.razorpay_order_id == data.razorpay_order_id
    ).first()

    if payment:
        payment.razorpay_payment_id = data.razorpay_payment_id
        payment.razorpay_signature  = data.razorpay_signature
        payment.status              = "paid"
        payment.paid_at             = datetime.utcnow()

    db.commit()

    return {
        "message":      "Payment verified! Subscription activated.",
        "plan":         plan.name,
        "display_name": plan.display_name,
        "ends_at":      ends_at.isoformat(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# 6. START FREE TRIAL
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/start-trial")
def start_trial(
    plan_name:    str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Start a 7-day free trial for Advanced or Extreme plan.
    Each user can only use one trial ever.
    After 7 days the account auto-drops to Basic.
    """

    if plan_name not in ["advanced", "extreme"]:
        raise HTTPException(
            status_code=400,
            detail="Trial only available for Advanced or Extreme plans"
        )

    # Check if user has ever had a trial
    existing_trial = db.query(UserSubscription).filter(
        UserSubscription.user_id  == current_user.id,
        UserSubscription.is_trial == True,
    ).first()

    if existing_trial:
        raise HTTPException(
            status_code=400,
            detail="You have already used your free trial"
        )

    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.name == plan_name
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    starts_at     = datetime.utcnow()
    trial_ends_at = starts_at + timedelta(days=7)

    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id
    ).first()

    if subscription:
        subscription.plan_id       = plan.id
        subscription.status        = "trial"
        subscription.is_trial      = True
        subscription.trial_ends_at = trial_ends_at
        subscription.starts_at     = starts_at
        subscription.ends_at       = trial_ends_at
    else:
        subscription = UserSubscription(
            user_id       = current_user.id,
            plan_id       = plan.id,
            billing_cycle = "monthly",
            status        = "trial",
            is_trial      = True,
            trial_ends_at = trial_ends_at,
            starts_at     = starts_at,
            ends_at       = trial_ends_at,
        )
        db.add(subscription)

    db.commit()

    return {
        "message":       f"7-day free trial started for {plan.display_name}!",
        "trial_ends_at": trial_ends_at.isoformat(),
        "plan":          plan.name,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 7. CANCEL SUBSCRIPTION
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/cancel")
def cancel_subscription(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Cancel current subscription.
    Access remains active until the billing period ends,
    then automatically drops to Basic plan.
    """

    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found"
        )

    if subscription.plan.name == "basic":
        raise HTTPException(
            status_code=400,
            detail="You are already on the free plan"
        )

    subscription.status = "cancelled"
    db.commit()

    return {
        "message": "Subscription cancelled. Access continues until period ends.",
        "ends_at": subscription.ends_at.isoformat() if subscription.ends_at else None,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 8. PAYMENT HISTORY
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/payment-history")
def payment_history(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Get current user's full payment history"""

    payments = db.query(PaymentHistory).filter(
        PaymentHistory.user_id == current_user.id
    ).order_by(PaymentHistory.created_at.desc()).all()

    return {
        "payments": [p.to_dict() for p in payments]
    }


# ══════════════════════════════════════════════════════════════════════════════
# 9. CHECK DOWNLOAD PERMISSION
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/check-download/{report_type}")
def check_download_permission(
    report_type:  str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Check if user can download a specific report/file based on their plan.

    report_type:
        ai     → AI Analysis Report (PDF)
        manual → Manual Estimation Report (PDF)
        3d     → 3D Model (GLB file)
    """

    if report_type not in ["ai", "manual", "3d"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type. Allowed: ai | manual | 3d"
        )

    allowed = check_pdf_permission(db, current_user.id, report_type)

    format_map = {
        "ai":     "PDF",
        "manual": "PDF",
        "3d":     "GLB",
    }

    return {
        "allowed":     allowed,
        "report_type": report_type,
        "format":      format_map[report_type],
        "message": (
            f"{format_map[report_type]} download allowed"
            if allowed
            else f"Upgrade your plan to download {format_map[report_type]} files"
        ),
    }