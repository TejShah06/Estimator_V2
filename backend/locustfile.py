
from locust import HttpUser, task, between, events
import random
import logging

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════
# TEST DATA
# ══════════════════════════════════════════════════════════════

TEST_USERS = [
    {"identifier": f"loadtest{i}@test.com", "password": "LoadTest@123"}
    for i in range(1, 11)
    for i in range(6, 17)
]

ADMIN_USER = {
    "identifier": "admin@floorplan3d.com",
}


# ══════════════════════════════════════════════════════════════
# HELPER
# ══════════════════════════════════════════════════════════════

def auth_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }


# ══════════════════════════════════════════════════════════════
# REGULAR USER
# ══════════════════════════════════════════════════════════════

class RegularUser(HttpUser):
    """
    Simulates a regular engineer using the app.
    weight=5 means 5 regular users per 1 admin user.
    """

    wait_time = between(1, 4)
    weight    = 5
    token     = None
    username  = None

    # ── Login ─────────────────────────────────────────────────
    def on_start(self):
        user = random.choice(TEST_USERS)

        with self.client.post(
            "/auth/login",
            json=user,
            catch_response=True,
            name="[AUTH] Login",
        ) as res:
            if res.status_code == 200:
                data          = res.json()
                self.token    = data.get("access_token")
                self.username = data.get("user", {}).get("username", "unknown")
                res.success()
                logger.info(f"✅ Logged in: {user['identifier']}")
            else:
                res.failure(
                    f"Login failed {res.status_code}: {res.text[:100]}"
                )
                self.token = None

    def headers(self):
        return auth_headers(self.token) if self.token else {}

    def skip_if_no_token(self) -> bool:
        return self.token is None

    def handle_401(self, res):
        """Clear token on 401 so next task re-evaluates"""
        res.failure("Token expired or invalid")
        self.token = None

    # ══════════════════════════════════════════════════════════
    # TASKS
    # ══════════════════════════════════════════════════════════

    # ── Dashboard ─────────────────────────────────────────────
    @task(10)
    def dashboard_stats(self):
        """Most visited — dashboard overview"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/dashboard/stats",
            headers=self.headers(),
            catch_response=True,
            name="[DASHBOARD] Stats",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code == 401: self.handle_401(res)
            else: res.failure(f"Failed {res.status_code}")

    # ── Projects ──────────────────────────────────────────────
    @task(8)
    def recent_projects(self):
        """Recent projects list"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/projects/recent",
            headers=self.headers(),
            catch_response=True,
            name="[PROJECTS] Recent",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code == 401: self.handle_401(res)
            else: res.failure(f"Failed {res.status_code}")

    # ── Manual Estimations ────────────────────────────────────
    @task(4)
    def list_manual_estimations(self):
        """List manual estimations — tests GET /estimations/manual"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/estimations/manual",       # ✅ correct URL (no trailing slash)
            headers=self.headers(),
            catch_response=True,
            name="[MANUAL] List",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code == 401: self.handle_401(res)
            else: res.failure(f"Failed {res.status_code}")

    # ── Floorplan Report ──────────────────────────────────────
    @task(3)
    def floorplan_report(self):
        """
        Test floorplan report endpoint.
        404 is acceptable — just tests auth + routing work.
        Uses random ID so we test real DB lookups.
        """
        if self.skip_if_no_token(): return

        project_id = random.randint(1, 20)

        with self.client.get(
            f"/floorplan/report/{project_id}",
            headers=self.headers(),
            catch_response=True,
            name="[FLOORPLAN] Report",
        ) as res:
            # 200 = found, 404 = not found (both are correct behaviour)
            if   res.status_code in [200, 404]: res.success()
            elif res.status_code == 401:         self.handle_401(res)
            else: res.failure(f"Failed {res.status_code}")

    # ── Subscription ──────────────────────────────────────────
    @task(6)
    def my_subscription(self):
        """Check current plan + usage counters"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/my-plan",
            headers=self.headers(),
            catch_response=True,
            name="[SUBSCRIPTION] My Plan",
        ) as res:
            if res.status_code == 200:
                data = res.json()
                if "subscription" in data and "usage" in data:
                    res.success()
                else:
                    res.failure("Response missing subscription or usage fields")
            elif res.status_code == 401:
                self.handle_401(res)
            else:
                res.failure(f"Failed {res.status_code}")

    @task(4)
    def view_pricing_plans(self):
        """Pricing plans — public endpoint, no token needed"""
        with self.client.get(
            "/subscription/plans",
            catch_response=True,
            name="[SUBSCRIPTION] Plans",
        ) as res:
            if res.status_code == 200:
                data = res.json()
                if "plans" in data and len(data["plans"]) > 0:
                    res.success()
                else:
                    res.failure("No plans returned")
            else:
                res.failure(f"Failed {res.status_code}")

    @task(2)
    def payment_history(self):
        """View payment history"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/payment-history",
            headers=self.headers(),
            catch_response=True,
            name="[SUBSCRIPTION] Payment History",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code == 401: self.handle_401(res)
            else: res.failure(f"Failed {res.status_code}")

    # ── Download Permissions ──────────────────────────────────
    @task(3)
    def check_ai_pdf_permission(self):
        """Check AI PDF download permission"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/check-download/ai",
            headers=self.headers(),
            catch_response=True,
            name="[PERMISSION] AI PDF",
        ) as res:
            if res.status_code == 200:
                if "allowed" in res.json():
                    res.success()
                else:
                    res.failure("Missing 'allowed' field")
            elif res.status_code == 401:
                self.handle_401(res)
            else:
                res.failure(f"Failed {res.status_code}")

    @task(3)
    def check_manual_pdf_permission(self):
        """Check Manual PDF download permission"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/check-download/manual",
            headers=self.headers(),
            catch_response=True,
            name="[PERMISSION] Manual PDF",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code == 401: self.handle_401(res)
            else: res.failure(f"Failed {res.status_code}")

    @task(3)
    def check_3d_glb_permission(self):
        """Check 3D GLB download permission"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/check-download/3d",
            headers=self.headers(),
            catch_response=True,
            name="[PERMISSION] 3D GLB",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code == 401: self.handle_401(res)
            else: res.failure(f"Failed {res.status_code}")

    # ── Usage Limits ──────────────────────────────────────────
    @task(2)
    def check_usage_limits(self):
        """Validate usage limit structure in response"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/my-plan",
            headers=self.headers(),
            catch_response=True,
            name="[USAGE] Check Limits",
        ) as res:
            if res.status_code == 200:
                data  = res.json()
                usage = data.get("usage", {})
                ai    = usage.get("ai_analysis", {})
                td    = usage.get("three_d", {})

                if (
                    "current" in ai and "limit" in ai
                    and "current" in td and "limit" in td
                ):
                    res.success()
                else:
                    res.failure("Invalid usage structure in response")
            elif res.status_code == 401:
                self.handle_401(res)
            else:
                res.failure(f"Failed {res.status_code}")


# ══════════════════════════════════════════════════════════════
# ADMIN USER
# ══════════════════════════════════════════════════════════════

class AdminUser(HttpUser):
    """
    Simulates admin panel usage.
    weight=1 means 1 admin per 5 regular users.
    """

    wait_time = between(2, 6)
    weight    = 1
    token     = None

    # ── Login ─────────────────────────────────────────────────
    def on_start(self):
        with self.client.post(
            "/auth/login",
            json=ADMIN_USER,
            catch_response=True,
            name="[ADMIN AUTH] Login",
        ) as res:
            if res.status_code == 200:
                self.token = res.json().get("access_token")
                res.success()
                logger.info("✅ Admin logged in")
            else:
                res.failure(
                    f"Admin login failed {res.status_code}: {res.text[:100]}"
                )
                self.token = None

    def headers(self):
        return auth_headers(self.token) if self.token else {}

    def skip_if_no_token(self) -> bool:
        return self.token is None

    def handle_auth_fail(self, res, code):
        if code == 401:
            res.failure("Admin token expired")
            self.token = None
        elif code == 403:
            res.failure("User is not admin — check ADMIN_USER credentials")
        else:
            res.failure(f"Auth failed {code}")

    # ══════════════════════════════════════════════════════════
    # TASKS
    # ══════════════════════════════════════════════════════════

    @task(5)
    def admin_dashboard(self):
        """Admin dashboard overview"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/dashboard/stats",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Dashboard",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")

    @task(4)
    def admin_users(self):
        """Admin user management"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/users?skip=0&limit=20",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Users",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")

    @task(3)
    def admin_subscription_stats(self):
        """Admin subscription overview"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/subscription/stats",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Subscription Stats",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")

    @task(3)
    def admin_subscription_users(self):
        """Admin subscription user list"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/subscription/users?skip=0&limit=20",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Subscription Users",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")

    @task(2)
    def admin_projects(self):
        """Admin project management"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/projects?skip=0&limit=20",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Projects",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")

    @task(2)
    def admin_logs(self):
        """Admin activity logs"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/logs?skip=0&limit=20",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Activity Logs",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")

    @task(1)
    def admin_analytics(self):
        """Admin monthly analytics chart data"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/analytics/monthly",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Monthly Analytics",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")

    @task(1)
    def admin_settings(self):
        """Admin settings"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/settings",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Settings",
        ) as res:
            if   res.status_code == 200: res.success()
            elif res.status_code in [401, 403]: self.handle_auth_fail(res, res.status_code)
            else: res.failure(f"Failed {res.status_code}")


# ══════════════════════════════════════════════════════════════
# TEST SUMMARY
# ══════════════════════════════════════════════════════════════

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n" + "=" * 55)
    print("        AI ESTIMATOR — LOAD TEST STARTING")
    print("=" * 55)
    print(f"  Target Host     : {environment.host}")
    print(f"  Regular Users   : weight 5")
    print(f"  Admin Users     : weight 1")
    print("=" * 55 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.runner.stats.total

    print("\n" + "=" * 55)
    print("        AI ESTIMATOR — LOAD TEST SUMMARY")
    print("=" * 55)
    print(f"  Total Requests  : {stats.num_requests}")
    print(f"  Failed          : {stats.num_failures}")
    print(f"  Failure Rate    : {stats.fail_ratio * 100:.2f}%")
    print(f"  Avg Response    : {stats.avg_response_time:.0f} ms")
    print(f"  Min Response    : {stats.min_response_time:.0f} ms")
    print(f"  Max Response    : {stats.max_response_time:.0f} ms")
    print(f"  Requests/sec    : {stats.current_rps:.1f}")
    print("=" * 55)

    # ── Result verdict ────────────────────────────────────────
    fail_pct = stats.fail_ratio * 100
    avg_ms   = stats.avg_response_time

    if fail_pct == 0 and avg_ms < 300:
        verdict = "✅  EXCELLENT — Zero failures, fast responses"
    elif fail_pct == 0 and avg_ms < 500:
        verdict = "✅  GOOD — Zero failures, acceptable speed"
    elif fail_pct < 1 and avg_ms < 500:
        verdict = "✅  GOOD — Under 1% failures"
    elif fail_pct < 5 and avg_ms < 1000:
        verdict = "⚠️   OK — Under 5% failures, watch response time"
    elif fail_pct < 5:
        verdict = "⚠️   SLOW — Under 5% failures but responses are slow"
    else:
        verdict = "❌  BAD — Over 5% failure rate, investigate!"

    print(f"  Result          : {verdict}")
    print("=" * 55 + "\n")

    # ── Per-endpoint failures ─────────────────────────────────
    print("  ENDPOINT BREAKDOWN:")
    print("  " + "-" * 50)

    for name, entry in environment.runner.stats.entries.items():
        if entry.num_failures > 0:
            fail_rate = (entry.num_failures / entry.num_requests) * 100
            print(
                f"  ❌ {name[1]:<40}"
                f"  {fail_rate:.1f}% failed"
                f"  ({entry.num_failures}/{entry.num_requests})"
            )

    print("  " + "-" * 50 + "\n")