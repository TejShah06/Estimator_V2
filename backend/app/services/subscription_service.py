from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.subscription_plan import SubscriptionPlan
from app.models.user_subscription import UserSubscription
from app.models.usage_tracking import UsageTracking
from app.models.user import User

# ── Seed default plans ────────────────────────────────────────────────────────
def seed_plans(db: Session):
    """
    Create the 3 default plans if they don't exist.
    Call this on startup.
    """
    existing = db.query(SubscriptionPlan).count()
    if existing >= 3:
        return  # Already seeded

    plans = [
        SubscriptionPlan(
            name="basic",
            display_name="Basic",
            monthly_price=0,
            yearly_price=0,
            ai_analyses_limit=5,
            three_d_limit=3,
            manual_limit=-1,
            can_download_ai_pdf=False,
            can_download_manual_pdf=True,
            can_download_3d_glb=False,
            description="Free plan for trying out the platform",
        ),
        SubscriptionPlan(
            name="advanced",
            display_name="Advanced",
            monthly_price=399,
            yearly_price=3999,
            ai_analyses_limit=-1,       # unlimited
            three_d_limit=15,
            manual_limit=-1,
            can_download_ai_pdf=True,
            can_download_manual_pdf=True,
            can_download_3d_glb=True,
            description="For professionals who need more power",
        ),
        SubscriptionPlan(
            name="extreme",
            display_name="Extreme",
            monthly_price=699,
            yearly_price=6999,
            ai_analyses_limit=-1,       # unlimited
            three_d_limit=-1,           # unlimited
            manual_limit=-1,
            can_download_ai_pdf=True,
            can_download_manual_pdf=True,
            can_download_3d_glb=True,
            description="All features, all unlimited",
        ),
    ]

    db.add_all(plans)
    db.commit()
    print("Subscription plans seeded successfully")


# ── Assign free plan to new user ──────────────────────────────────────────────
def assign_free_plan(db: Session, user_id: int):
    """
    Assign Basic (free) plan to a newly registered user.
    """
    # Get basic plan
    basic_plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.name == "basic"
    ).first()

    if not basic_plan:
        seed_plans(db)
        basic_plan = db.query(SubscriptionPlan).filter(
            SubscriptionPlan.name == "basic"
        ).first()

    # Check if user already has a subscription
    existing = db.query(UserSubscription).filter(
        UserSubscription.user_id == user_id
    ).first()

    if existing:
        return existing

    # Create subscription
    subscription = UserSubscription(
        user_id=user_id,
        plan_id=basic_plan.id,
        billing_cycle="monthly",
        status="active",
        is_trial=False,
        starts_at=datetime.utcnow(),
        ends_at=None,              # Free plan never expires
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


# ── Get current user subscription ────────────────────────────────────────────
def get_user_subscription(db: Session, user_id: int) -> UserSubscription:
    """
    Get user's current active subscription.
    Auto-assigns free plan if none exists.
    """
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user_id
    ).first()

    if not subscription:
        subscription = assign_free_plan(db, user_id)

    # Check if trial has expired → downgrade to basic
    if subscription.is_trial and subscription.trial_ends_at:
        if datetime.utcnow() > subscription.trial_ends_at.replace(tzinfo=None):
            _downgrade_to_basic(db, subscription)

    # Check if paid subscription has expired → downgrade to basic
    if (
        not subscription.is_trial
        and subscription.ends_at
        and subscription.plan.name != "basic"
    ):
        if datetime.utcnow() > subscription.ends_at.replace(tzinfo=None):
            _downgrade_to_basic(db, subscription)

    return subscription


def _downgrade_to_basic(db: Session, subscription: UserSubscription):
    """Downgrade expired subscription to basic plan."""
    basic_plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.name == "basic"
    ).first()

    subscription.plan_id      = basic_plan.id
    subscription.status       = "active"
    subscription.is_trial     = False
    subscription.trial_ends_at = None
    subscription.ends_at      = None
    subscription.billing_cycle = "monthly"
    subscription.razorpay_subscription_id = None

    db.commit()
    db.refresh(subscription)


# ── Usage Tracking ────────────────────────────────────────────────────────────
def get_current_usage(db: Session, user_id: int, usage_type: str) -> int:
    """
    Get current usage count for a user in the rolling 30-day window.
    usage_type: 'ai_analysis' | 'three_d' | 'manual'
    """
    now = datetime.utcnow()

    # Find active period
    tracking = db.query(UsageTracking).filter(
        UsageTracking.user_id   == user_id,
        UsageTracking.usage_type == usage_type,
        UsageTracking.period_start <= now,
        UsageTracking.period_end   >= now,
    ).first()

    return tracking.count if tracking else 0


def increment_usage(db: Session, user_id: int, usage_type: str) -> int:
    """
    Increment usage count for a user.
    Creates new period if none exists.
    Returns new count.
    """
    now = datetime.utcnow()

    # Find or create active period
    tracking = db.query(UsageTracking).filter(
        UsageTracking.user_id    == user_id,
        UsageTracking.usage_type == usage_type,
        UsageTracking.period_start <= now,
        UsageTracking.period_end   >= now,
    ).first()

    if not tracking:
        # Get user signup date for rolling window anchor
        user = db.query(User).filter(User.id == user_id).first()
        period_start = now
        period_end   = now + timedelta(days=30)

        tracking = UsageTracking(
            user_id      = user_id,
            usage_type   = usage_type,
            period_start = period_start,
            period_end   = period_end,
            count        = 0,
        )
        db.add(tracking)

    tracking.count += 1
    db.commit()
    db.refresh(tracking)
    return tracking.count


def check_usage_limit(db: Session, user_id: int, usage_type: str) -> dict:
    """
    Check if user can perform an action based on their plan limits.
    Returns: { allowed: bool, current: int, limit: int, plan: str }
    """
    subscription = get_user_subscription(db, user_id)
    plan         = subscription.plan

    # Get limit based on usage type
    if usage_type == "ai_analysis":
        limit = plan.ai_analyses_limit
    elif usage_type == "three_d":
        limit = plan.three_d_limit
    elif usage_type == "manual":
        limit = plan.manual_limit
    else:
        limit = -1

    # -1 means unlimited
    if limit == -1:
        return {
            "allowed": True,
            "current": 0,
            "limit": -1,
            "plan": plan.name,
            "display_name": plan.display_name,
        }

    current = get_current_usage(db, user_id, usage_type)

    return {
        "allowed": current < limit,
        "current": current,
        "limit": limit,
        "plan": plan.name,
        "display_name": plan.display_name,
    }


def check_pdf_permission(db: Session, user_id: int, pdf_type: str) -> bool:
    """
    Check if user can download a PDF report.
    pdf_type: 'ai' | 'manual' | '3d'
    """
    subscription = get_user_subscription(db, user_id)
    plan         = subscription.plan

    if pdf_type == "ai":
        return plan.can_download_ai_pdf
    elif pdf_type == "manual":
        return plan.can_download_manual_pdf
    elif pdf_type == "3d":
        return plan.can_download_3d_glb

    return False