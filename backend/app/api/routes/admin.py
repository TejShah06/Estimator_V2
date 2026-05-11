from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime

from app.api.deps import get_db, get_admin_user
from app.models.user import User
from app.models.floorplan_project import FloorPlanProject
from app.models.manual_estimation import ManualEstimation
from app.models.manual_estimation import ManualEstimationCost
from app.models.admin_settings import AdminSettings
from app.models.admin_activity_log import AdminActivityLog

#   NEW imports
from app.models.subscription_plan import SubscriptionPlan
from app.models.user_subscription import UserSubscription
from app.models.payment_history import PaymentHistory

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================
# HELPER FUNCTION - LOG ADMIN ACTIVITY
# ============================================================
def log_activity(
    db: Session,
    admin_id: int,
    action: str,
    target_type: str = None,
    target_id: int = None,
    description: str = None
):
    log = AdminActivityLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        description=description,
    )
    db.add(log)
    db.commit()


# ============================================================
# 1. DASHBOARD STATS
# ============================================================
@router.get("/dashboard/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # User stats
    total_users = db.query(User).filter(
        User.role != "admin",
        User.is_deleted == False
    ).count()

    active_users = db.query(User).filter(
        User.role != "admin",
        User.is_active == True,
        User.is_deleted == False
    ).count()

    inactive_users = db.query(User).filter(
        User.role != "admin",
        User.is_active == False,
        User.is_deleted == False
    ).count()

    # Project stats
    total_ai_projects = db.query(FloorPlanProject).filter(
        FloorPlanProject.is_deleted == False
    ).count()

    total_manual_estimations = db.query(ManualEstimation).filter(
        ManualEstimation.is_deleted == False
    ).count()

    # Cost stats
    ai_total_cost = db.query(
        func.coalesce(func.sum(FloorPlanProject.estimated_cost), 0)
    ).filter(FloorPlanProject.is_deleted == False).scalar()

    manual_estimations = db.query(ManualEstimation).filter(
        ManualEstimation.is_deleted == False
    ).all()

    manual_total_cost = sum(
        sum(c.total_cost for c in est.costs) if est.costs else 0
        for est in manual_estimations
    )

    # Latest 5 users
    latest_users = db.query(User).filter(
        User.role != "admin",
        User.is_deleted == False
    ).order_by(User.created_at.desc()).limit(5).all()

    # Latest 5 projects
    latest_ai = db.query(FloorPlanProject).filter(
        FloorPlanProject.is_deleted == False
    ).order_by(FloorPlanProject.created_at.desc()).limit(5).all()

    latest_manual = db.query(ManualEstimation).filter(
        ManualEstimation.is_deleted == False
    ).order_by(ManualEstimation.created_at.desc()).limit(5).all()

    return {
        "users": {
            "total":    total_users,
            "active":   active_users,
            "inactive": inactive_users,
        },
        "projects": {
            "total_ai":     total_ai_projects,
            "total_manual": total_manual_estimations,
            "total":        total_ai_projects + total_manual_estimations,
        },
        "costs": {
            "ai_total":     float(ai_total_cost or 0),
            "manual_total": float(manual_total_cost or 0),
            "grand_total":  float(ai_total_cost or 0) + float(manual_total_cost or 0),
        },
        "latest_users": [
            {
                "id":         u.id,
                "username":   u.username,
                "email":      u.email,
                "is_active":  u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in latest_users
        ],
        "latest_projects": [
            {
                "id":         f"ai-{p.id}",
                "name":       p.project_name,
                "type":       "ai",
                "cost":       float(p.estimated_cost or 0),
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in latest_ai
        ] + [
            {
                "id":         f"manual-{m.id}",
                "name":       m.estimation_name,
                "type":       "manual",
                "cost":       sum(c.total_cost for c in m.costs) if m.costs else 0,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in latest_manual
        ],
    }


# ============================================================
#   NEW: SUBSCRIPTION STATS
# ============================================================
@router.get("/subscription/stats")
def get_subscription_stats(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user)
):
    """Get subscription statistics for admin dashboard"""

    # ── Users per plan ────────────────────────────────────────────────────────
    plans = db.query(SubscriptionPlan).all()

    plan_stats = []
    for plan in plans:
        count = db.query(UserSubscription).filter(
            UserSubscription.plan_id == plan.id,
            UserSubscription.status.in_(["active", "trial"])
        ).count()

        plan_stats.append({
            "plan_name":    plan.name,
            "display_name": plan.display_name,
            "user_count":   count,
            "monthly_price": plan.monthly_price,
            "yearly_price":  plan.yearly_price,
        })

    # ── Active subscriptions ──────────────────────────────────────────────────
    total_active = db.query(UserSubscription).filter(
        UserSubscription.status == "active"
    ).count()

    total_trial = db.query(UserSubscription).filter(
        UserSubscription.status == "trial"
    ).count()

    total_cancelled = db.query(UserSubscription).filter(
        UserSubscription.status == "cancelled"
    ).count()

    total_expired = db.query(UserSubscription).filter(
        UserSubscription.status == "expired"
    ).count()

    # ── Revenue ───────────────────────────────────────────────────────────────
    total_revenue = db.query(
        func.coalesce(func.sum(PaymentHistory.amount), 0)
    ).filter(
        PaymentHistory.status == "paid"
    ).scalar()

    monthly_revenue = db.query(
        func.coalesce(func.sum(PaymentHistory.amount), 0)
    ).filter(
        PaymentHistory.status       == "paid",
        PaymentHistory.billing_cycle == "monthly"
    ).scalar()

    yearly_revenue = db.query(
        func.coalesce(func.sum(PaymentHistory.amount), 0)
    ).filter(
        PaymentHistory.status        == "paid",
        PaymentHistory.billing_cycle == "yearly"
    ).scalar()

    # ── Recent payments (last 10) ─────────────────────────────────────────────
    recent_payments = db.query(PaymentHistory).filter(
        PaymentHistory.status == "paid"
    ).order_by(PaymentHistory.paid_at.desc()).limit(10).all()

    recent_payments_list = []
    for p in recent_payments:
        user = db.query(User).filter(User.id == p.user_id).first()
        recent_payments_list.append({
            "id":                   p.id,
            "user_id":              p.user_id,
            "username":             user.username if user else "Unknown",
            "email":                user.email    if user else "Unknown",
            "plan_name":            p.plan_name,
            "billing_cycle":        p.billing_cycle,
            "amount":               p.amount,
            "razorpay_payment_id":  p.razorpay_payment_id,
            "paid_at":              p.paid_at.isoformat() if p.paid_at else None,
        })

    # ── Recent subscriptions (last 10) ────────────────────────────────────────
    recent_subs = db.query(UserSubscription).order_by(
        UserSubscription.created_at.desc()
    ).limit(10).all()

    recent_subs_list = []
    for s in recent_subs:
        user = db.query(User).filter(User.id == s.user_id).first()
        recent_subs_list.append({
            "user_id":      s.user_id,
            "username":     user.username     if user else "Unknown",
            "email":        user.email        if user else "Unknown",
            "plan_name":    s.plan.name       if s.plan else "unknown",
            "display_name": s.plan.display_name if s.plan else "Unknown",
            "status":       s.status,
            "is_trial":     s.is_trial,
            "billing_cycle": s.billing_cycle,
            "starts_at":    s.starts_at.isoformat() if s.starts_at else None,
            "ends_at":      s.ends_at.isoformat()   if s.ends_at   else None,
        })

    return {
        "plan_stats":          plan_stats,
        "subscription_status": {
            "active":    total_active,
            "trial":     total_trial,
            "cancelled": total_cancelled,
            "expired":   total_expired,
        },
        "revenue": {
            "total":   float(total_revenue   or 0),
            "monthly": float(monthly_revenue or 0),
            "yearly":  float(yearly_revenue  or 0),
        },
        "recent_payments":      recent_payments_list,
        "recent_subscriptions": recent_subs_list,
    }


# ============================================================
#   NEW: GET ALL USERS WITH SUBSCRIPTION INFO
# ============================================================
@router.get("/subscription/users")
def get_users_with_subscriptions(
    skip:   int = 0,
    limit:  int = 20,
    search: str = None,
    plan:   str = None,   # basic / advanced / extreme
    db:     Session = Depends(get_db),
    admin:  User    = Depends(get_admin_user)
):
    """Get all users with their subscription plan details"""

    query = db.query(User).filter(
        User.role     != "admin",
        User.is_deleted == False
    )

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for u in users:
        # Get subscription
        sub = db.query(UserSubscription).filter(
            UserSubscription.user_id == u.id
        ).first()

        plan_info = {
            "plan_name":    "basic",
            "display_name": "Basic",
            "status":       "active",
            "is_trial":     False,
            "billing_cycle": "monthly",
            "ends_at":      None,
        }

        if sub and sub.plan:
            plan_info = {
                "plan_name":     sub.plan.name,
                "display_name":  sub.plan.display_name,
                "status":        sub.status,
                "is_trial":      sub.is_trial,
                "billing_cycle": sub.billing_cycle,
                "ends_at":       sub.ends_at.isoformat() if sub.ends_at else None,
            }

        # Filter by plan if specified
        if plan and plan_info["plan_name"] != plan:
            continue

        result.append({
            "id":           u.id,
            "username":     u.username,
            "email":        u.email,
            "full_name":    u.full_name,
            "is_active":    u.is_active,
            "created_at":   u.created_at.isoformat() if u.created_at else None,
            "subscription": plan_info,
        })

    return {
        "total": total,
        "users": result,
    }


# ============================================================
# 2. ANALYTICS - AI vs MANUAL MONTHLY TREND
# ============================================================
@router.get("/analytics/monthly")
def get_monthly_analytics(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user)
):
    ai_monthly = db.query(
        extract('month', FloorPlanProject.created_at).label('month'),
        extract('year',  FloorPlanProject.created_at).label('year'),
        func.count(FloorPlanProject.id).label('count')
    ).filter(
        FloorPlanProject.is_deleted == False
    ).group_by('year', 'month').order_by('year', 'month').all()

    manual_monthly = db.query(
        extract('month', ManualEstimation.created_at).label('month'),
        extract('year',  ManualEstimation.created_at).label('year'),
        func.count(ManualEstimation.id).label('count')
    ).filter(
        ManualEstimation.is_deleted == False
    ).group_by('year', 'month').order_by('year', 'month').all()

    month_names = ["Jan","Feb","Mar","Apr","May","Jun",
                   "Jul","Aug","Sep","Oct","Nov","Dec"]

    ai_data     = {f"{int(r.year)}-{int(r.month)}": r.count for r in ai_monthly}
    manual_data = {f"{int(r.year)}-{int(r.month)}": r.count for r in manual_monthly}

    all_months = sorted(set(list(ai_data.keys()) + list(manual_data.keys())))

    chart_data = []
    for month_key in all_months:
        year, month = month_key.split("-")
        chart_data.append({
            "month":  f"{month_names[int(month) - 1]} {year}",
            "ai":     ai_data.get(month_key, 0),
            "manual": manual_data.get(month_key, 0),
        })

    return {
        "chart_data":   chart_data,
        "total_ai":     sum(ai_data.values()),
        "total_manual": sum(manual_data.values()),
    }


# ============================================================
# 3. USER MANAGEMENT
# ============================================================
@router.get("/users")
def get_all_users(
    skip:   int = 0,
    limit:  int = 20,
    search: str = None,
    status: str = None,
    db:     Session = Depends(get_db),
    admin:  User    = Depends(get_admin_user)
):
    query = db.query(User).filter(
        User.role     != "admin",
        User.is_deleted == False
    )

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%"))  |
            (User.email.ilike(f"%{search}%"))      |
            (User.full_name.ilike(f"%{search}%"))
        )

    if status == "active":
        query = query.filter(User.is_active == True)
    elif status == "inactive":
        query = query.filter(User.is_active == False)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for u in users:
        #   Include subscription info in user list
        sub = db.query(UserSubscription).filter(
            UserSubscription.user_id == u.id
        ).first()

        sub_info = {
            "plan_name":    "basic",
            "display_name": "Basic",
            "status":       "active",
        }
        if sub and sub.plan:
            sub_info = {
                "plan_name":    sub.plan.name,
                "display_name": sub.plan.display_name,
                "status":       sub.status,
            }

        result.append({
            "id":           u.id,
            "username":     u.username,
            "email":        u.email,
            "full_name":    u.full_name,
            "role":         u.role,
            "is_active":    u.is_active,
            "created_at":   u.created_at.isoformat() if u.created_at else None,
            "last_login":   u.last_login.isoformat()  if u.last_login else None,
            "ai_projects":  db.query(FloorPlanProject).filter(
                FloorPlanProject.user_id   == u.id,
                FloorPlanProject.is_deleted == False
            ).count(),
            "manual_estimations": db.query(ManualEstimation).filter(
                ManualEstimation.user_id   == u.id,
                ManualEstimation.is_deleted == False
            ).count(),
            "subscription": sub_info,   #   NEW
        })

    return {"total": total, "users": result}


@router.get("/users/{user_id}")
def get_user_detail(
    user_id: int,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(get_admin_user)
):
    user = db.query(User).filter(
        User.id         == user_id,
        User.is_deleted == False
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ai_projects = db.query(FloorPlanProject).filter(
        FloorPlanProject.user_id    == user_id,
        FloorPlanProject.is_deleted == False
    ).order_by(FloorPlanProject.created_at.desc()).limit(5).all()

    manual_estimations = db.query(ManualEstimation).filter(
        ManualEstimation.user_id    == user_id,
        ManualEstimation.is_deleted == False
    ).order_by(ManualEstimation.created_at.desc()).limit(5).all()

    #   Include subscription
    sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == user_id
    ).first()

    sub_info = {
        "plan_name":    "basic",
        "display_name": "Basic",
        "status":       "active",
        "is_trial":     False,
        "billing_cycle": "monthly",
        "ends_at":      None,
    }
    if sub and sub.plan:
        sub_info = {
            "plan_name":     sub.plan.name,
            "display_name":  sub.plan.display_name,
            "status":        sub.status,
            "is_trial":      sub.is_trial,
            "billing_cycle": sub.billing_cycle,
            "ends_at":       sub.ends_at.isoformat() if sub.ends_at else None,
        }

    return {
        "id":           user.id,
        "username":     user.username,
        "email":        user.email,
        "full_name":    user.full_name,
        "role":         user.role,
        "is_active":    user.is_active,
        "created_at":   user.created_at.isoformat() if user.created_at else None,
        "last_login":   user.last_login.isoformat()  if user.last_login else None,
        "subscription": sub_info,   #   NEW
        "ai_projects_count":         len(ai_projects),
        "manual_estimations_count":  len(manual_estimations),
        "recent_ai_projects": [
            {
                "id":         p.id,
                "name":       p.project_name,
                "cost":       float(p.estimated_cost or 0),
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in ai_projects
        ],
        "recent_manual_estimations": [
            {
                "id":         m.id,
                "name":       m.estimation_name,
                "cost":       sum(c.total_cost for c in m.costs) if m.costs else 0,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in manual_estimations
        ],
    }


@router.patch("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(get_admin_user)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    user = db.query(User).filter(
        User.id == user_id, User.is_deleted == False
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()

    action = "activated" if user.is_active else "deactivated"
    log_activity(db=db, admin_id=admin.id, action=f"user_{action}",
                 target_type="user", target_id=user_id,
                 description=f"Admin {action} user: {user.username} ({user.email})")

    return {"message": f"User {action} successfully", "user_id": user_id, "is_active": user.is_active}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db:      Session = Depends(get_db),
    admin:   User    = Depends(get_admin_user)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(User).filter(
        User.id == user_id, User.is_deleted == False
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = user.username
    email    = user.email

    user.is_deleted = True
    user.is_active  = False
    user.deleted_at = datetime.utcnow()
    db.commit()

    log_activity(db=db, admin_id=admin.id, action="user_deleted",
                 target_type="user", target_id=user_id,
                 description=f"Admin deleted user: {username} ({email})")

    return {"message": "User deleted successfully"}


# ============================================================
# 4. PROJECT MANAGEMENT
# ============================================================
@router.get("/projects")
def get_all_projects(
    skip:        int = 0,
    limit:       int = 20,
    source_type: str = None,
    user_id:     int = None,
    db:          Session = Depends(get_db),
    admin:       User    = Depends(get_admin_user)
):
    combined = []

    if source_type is None or source_type == "ai":
        ai_query = db.query(FloorPlanProject).filter(FloorPlanProject.is_deleted == False)
        if user_id:
            ai_query = ai_query.filter(FloorPlanProject.user_id == user_id)
        for p in ai_query.order_by(FloorPlanProject.created_at.desc()).all():
            user = db.query(User).filter(User.id == p.user_id).first()
            combined.append({
                "id": f"ai-{p.id}", "real_id": p.id,
                "name": p.project_name or f"AI Project #{p.id}",
                "source_type": "ai", "cost": float(p.estimated_cost or 0),
                "area": float(p.total_area_sqft or 0), "rooms": p.rooms_count or 0,
                "status": p.status or "completed",
                "user": {"id": user.id if user else None,
                         "username": user.username if user else "Unknown",
                         "email": user.email if user else "Unknown"},
                "created_at": p.created_at.isoformat() if p.created_at else None,
            })

    if source_type is None or source_type == "manual":
        manual_query = db.query(ManualEstimation).filter(ManualEstimation.is_deleted == False)
        if user_id:
            manual_query = manual_query.filter(ManualEstimation.user_id == user_id)
        for m in manual_query.order_by(ManualEstimation.created_at.desc()).all():
            user = db.query(User).filter(User.id == m.user_id).first()
            total_cost = sum(c.total_cost for c in m.costs) if m.costs else 0
            combined.append({
                "id": f"manual-{m.id}", "real_id": m.id,
                "name": m.estimation_name, "source_type": "manual",
                "cost": float(total_cost), "area": float(m.area_sqft or 0),
                "rooms": 0, "status": m.status or "completed",
                "user": {"id": user.id if user else None,
                         "username": user.username if user else "Unknown",
                         "email": user.email if user else "Unknown"},
                "created_at": m.created_at.isoformat() if m.created_at else None,
            })

    combined.sort(key=lambda x: x["created_at"] or "", reverse=True)
    total     = len(combined)
    paginated = combined[skip:skip + limit]
    return {"total": total, "projects": paginated}


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    db:         Session = Depends(get_db),
    admin:      User    = Depends(get_admin_user)
):
    if project_id.startswith("ai-"):
        real_id = int(project_id.split("-")[1])
        project = db.query(FloorPlanProject).filter(
            FloorPlanProject.id == real_id, FloorPlanProject.is_deleted == False
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        project.is_deleted = True
        project.deleted_at = datetime.utcnow()
        db.commit()
        log_activity(db=db, admin_id=admin.id, action="project_deleted",
                     target_type="ai_project", target_id=real_id,
                     description=f"Admin deleted AI project: {project.project_name}")

    elif project_id.startswith("manual-"):
        real_id    = int(project_id.split("-")[1])
        estimation = db.query(ManualEstimation).filter(
            ManualEstimation.id == real_id, ManualEstimation.is_deleted == False
        ).first()
        if not estimation:
            raise HTTPException(status_code=404, detail="Estimation not found")
        estimation.is_deleted = True
        estimation.deleted_at = datetime.utcnow()
        db.commit()
        log_activity(db=db, admin_id=admin.id, action="project_deleted",
                     target_type="manual_estimation", target_id=real_id,
                     description=f"Admin deleted manual estimation: {estimation.estimation_name}")
    else:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    return {"message": "Project deleted successfully", "id": project_id}


# ============================================================
# 5. SETTINGS
# ============================================================
@router.get("/settings")
def get_settings(
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user)
):
    settings = db.query(AdminSettings).all()
    if not settings:
        defaults = [
            AdminSettings(setting_key="steel_rate_per_kg",      setting_value="70",   description="Default steel rate per kg"),
            AdminSettings(setting_key="cement_rate_per_bag",     setting_value="400",  description="Default cement rate per bag"),
            AdminSettings(setting_key="sand_rate_per_ton",       setting_value="1200", description="Default sand rate per ton"),
            AdminSettings(setting_key="aggregate_rate_per_ton",  setting_value="1000", description="Default aggregate rate per ton"),
            AdminSettings(setting_key="brick_rate_per_unit",     setting_value="8",    description="Default brick rate per unit"),
            AdminSettings(setting_key="paint_rate_per_liter",    setting_value="20",   description="Default paint rate per liter"),
            AdminSettings(setting_key="default_wastage_percent", setting_value="5",    description="Default wastage percentage"),
        ]
        db.add_all(defaults)
        db.commit()
        settings = db.query(AdminSettings).all()

    return {
        setting.setting_key: {
            "value":       setting.setting_value,
            "description": setting.description,
            "updated_at":  setting.updated_at.isoformat() if setting.updated_at else None
        }
        for setting in settings
    }


@router.put("/settings")
def update_settings(
    settings_data: dict,
    db:            Session = Depends(get_db),
    admin:         User    = Depends(get_admin_user)
):
    updated = []
    for key, value in settings_data.items():
        setting = db.query(AdminSettings).filter(AdminSettings.setting_key == key).first()
        if setting:
            old_value            = setting.setting_value
            setting.setting_value = str(value)
            updated.append(key)
            log_activity(db=db, admin_id=admin.id, action="setting_updated",
                         target_type="settings",
                         description=f"Admin updated {key}: {old_value} → {value}")
    db.commit()
    return {"message": f"Updated {len(updated)} settings", "updated_keys": updated}


# ============================================================
# 6. ACTIVITY LOGS
# ============================================================
@router.get("/logs")
def get_activity_logs(
    skip:  int = 0,
    limit: int = 20,
    db:    Session = Depends(get_db),
    admin: User    = Depends(get_admin_user)
):
    total = db.query(AdminActivityLog).count()
    logs  = db.query(AdminActivityLog).order_by(
        AdminActivityLog.performed_at.desc()
    ).offset(skip).limit(limit).all()

    return {
        "total": total,
        "logs": [
            {
                "id":           log.id,
                "action":       log.action,
                "target_type":  log.target_type,
                "target_id":    log.target_id,
                "description":  log.description,
                "performed_at": log.performed_at.isoformat() if log.performed_at else None,
            }
            for log in logs
        ]
    }