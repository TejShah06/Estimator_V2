
from locust import HttpUser, task, between, events
import random
import logging

logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════════════════
# TEST DATA — UPDATE THESE
# ══════════════════════════════════════════════════════════════════════════════

# Regular users — must exist in your DB
TEST_USERS = [
    {"identifier": f"loadtest{i}@test.com", "password": "LoadTest@123"}
    for i in range(1, 11)
]

# Admin user — use YOUR actual admin credentials
ADMIN_USER = {
    "identifier": "admin@floorplan3d.com",
    "password":   "passworda1"              # ← PUT YOUR REAL ADMIN PASSWORD HERE
}


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════
def auth_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }


# ══════════════════════════════════════════════════════════════════════════════
# REGULAR USER
# ══════════════════════════════════════════════════════════════════════════════
class RegularUser(HttpUser):
    """Simulates a regular user — higher weight = more users spawned"""

    wait_time = between(1, 4)
    weight    = 5             # 5x more regular users than admin
    token     = None
    username  = None

    # ── Login ─────────────────────────────────────────────────────────────────
    def on_start(self):
        user = random.choice(TEST_USERS)

        with self.client.post(
            "/auth/login",
            json=user,
            catch_response=True,
            name="[AUTH] Login"
        ) as res:
            if res.status_code == 200:
                data          = res.json()
                self.token    = data.get("access_token")
                self.username = data.get("user", {}).get("username", "unknown")
                res.success()
            else:
                res.failure(f"Login failed {res.status_code}: {res.text[:100]}")
                self.token = None

    def headers(self):
        return auth_headers(self.token) if self.token else {}

    def skip_if_no_token(self):
        """Return True if we should skip this task"""
        return self.token is None

    # ══════════════════════════════════════════════════════════════════════════
    # TASKS — weight = how often each task runs
    # ══════════════════════════════════════════════════════════════════════════

    @task(10)
    def dashboard_stats(self):
        """Most visited page"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/dashboard/stats",
            headers=self.headers(),
            catch_response=True,
            name="[DASHBOARD] Stats"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None   # Force re-login next cycle
            else:
                res.failure(f"Failed {res.status_code}")

    @task(8)
    def recent_projects(self):
        """Recent projects list"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/projects/recent",          
            headers=self.headers(),
            catch_response=True,
            name="[PROJECTS] Recent"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")

    @task(6)
    def my_subscription(self):
        """Check subscription + usage"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/my-plan",
            headers=self.headers(),
            catch_response=True,
            name="[SUBSCRIPTION] My Plan"
        ) as res:
            if res.status_code == 200:
                data = res.json()
                if "subscription" in data and "usage" in data:
                    res.success()
                else:
                    res.failure("Missing fields in response")
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")

    @task(4)
    def view_pricing_plans(self):
        """Browse pricing — public endpoint, no token needed"""
        with self.client.get(
            "/subscription/plans",
            catch_response=True,
            name="[SUBSCRIPTION] Plans"
        ) as res:
            if res.status_code == 200:
                data = res.json()
                if "plans" in data and len(data["plans"]) > 0:
                    res.success()
                else:
                    res.failure("No plans in response")
            else:
                res.failure(f"Failed {res.status_code}")

    @task(3)
    def check_ai_pdf_permission(self):
        """Check AI PDF download permission"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/check-download/ai",
            headers=self.headers(),
            catch_response=True,
            name="[PERMISSION] AI PDF"
        ) as res:
            if res.status_code == 200:
                data = res.json()
                if "allowed" in data:
                    res.success()
                else:
                    res.failure("Missing 'allowed' field")
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
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
            name="[PERMISSION] Manual PDF"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")

    @task(3)
    def check_3d_glb_permission(self):
        """Check 3D GLB download permission"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/check-download/3d",
            headers=self.headers(),
            catch_response=True,
            name="[PERMISSION] 3D GLB"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
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
            name="[SUBSCRIPTION] Payment History"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")

    @task(2)
    def list_floorplan_projects(self):
        """FIXED: correct endpoint for floorplan projects"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/floorplan/report/1",   # adjust as needed
            headers=self.headers(),
            catch_response=True,
            name="[FLOORPLAN] Report"
        ) as res:
            # 404 is OK (project may not exist) — we just test the endpoint works
            if res.status_code in [200, 404]:
                res.success()
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")

    @task(2)
    def check_usage_limits(self):
        """Check usage limits — validates response structure"""
        if self.skip_if_no_token(): return

        with self.client.get(
            "/subscription/my-plan",
            headers=self.headers(),
            catch_response=True,
            name="[USAGE] Check Limits"
        ) as res:
            if res.status_code == 200:
                data  = res.json()
                usage = data.get("usage", {})
                ai    = usage.get("ai_analysis", {})
                td    = usage.get("three_d", {})

                if "current" in ai and "limit" in ai and "current" in td:
                    res.success()
                else:
                    res.failure("Invalid usage structure")
            elif res.status_code == 401:
                res.failure("Token expired")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN USER
# ══════════════════════════════════════════════════════════════════════════════
class AdminUser(HttpUser):
    """Simulates admin panel usage — lower weight = fewer admin users"""

    wait_time = between(2, 6)
    weight    = 1             # 1 admin per 5 regular users
    token     = None

    def on_start(self):
        with self.client.post(
            "/auth/login",
            json=ADMIN_USER,
            catch_response=True,
            name="[ADMIN AUTH] Login"
        ) as res:
            if res.status_code == 200:
                self.token = res.json().get("access_token")
                res.success()
                logger.info("Admin logged in")
            else:
                res.failure(
                    f"Admin login failed {res.status_code}: {res.text[:100]}\n"
                    f"Check ADMIN_USER password in locustfile.py"
                )
                self.token = None

    def headers(self):
        return auth_headers(self.token) if self.token else {}

    def skip_if_no_token(self):
        return self.token is None

    @task(5)
    def admin_dashboard(self):
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/dashboard/stats",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Dashboard"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code == 401:
                res.failure("Admin token expired")
                self.token = None
            elif res.status_code == 403:
                res.failure("Not an admin account")
            else:
                res.failure(f"Failed {res.status_code}")

    @task(4)
    def admin_users(self):
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/users?skip=0&limit=20",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Users"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code in [401, 403]:
                res.failure(f"Auth failed {res.status_code}")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")

    @task(3)
    def admin_subscription_stats(self):
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/subscription/stats",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Subscription Stats"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code in [401, 403]:
                res.failure(f"Auth failed {res.status_code}")
                self.token = None
            else:
                res.failure(f"Failed {res.status_code}")

    @task(2)
    def admin_projects(self):
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/projects?skip=0&limit=20",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Projects"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code in [401, 403]:
                res.failure(f"Auth failed {res.status_code}")
            else:
                res.failure(f"Failed {res.status_code}")

    @task(2)
    def admin_logs(self):
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/logs?skip=0&limit=20",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Logs"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code in [401, 403]:
                res.failure(f"Auth failed {res.status_code}")
            else:
                res.failure(f"Failed {res.status_code}")

    @task(1)
    def admin_analytics(self):
        if self.skip_if_no_token(): return

        with self.client.get(
            "/admin/analytics/monthly",
            headers=self.headers(),
            catch_response=True,
            name="[ADMIN] Analytics"
        ) as res:
            if res.status_code == 200:
                res.success()
            elif res.status_code in [401, 403]:
                res.failure(f"Auth failed {res.status_code}")
            else:
                res.failure(f"Failed {res.status_code}")


# ══════════════════════════════════════════════════════════════════════════════
# TEST SUMMARY ON STOP
# ══════════════════════════════════════════════════════════════════════════════
@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.runner.stats.total

    print("\n" + "=" * 55)
    print("           LOAD TEST SUMMARY")
    print("=" * 55)
    print(f"  Total Requests  : {stats.num_requests}")
    print(f"  Failed          : {stats.num_failures}")
    print(f"  Failure Rate    : {stats.fail_ratio * 100:.1f}%")
    print(f"  Avg Response    : {stats.avg_response_time:.0f} ms")
    print(f"  Max Response    : {stats.max_response_time:.0f} ms")
    print(f"  Requests/sec    : {stats.current_rps:.1f}")
    print("=" * 55)

    if stats.fail_ratio == 0:
        print("  PERFECT — Zero failures!")
    elif stats.fail_ratio < 0.01:
        print("  GOOD — Under 1% failure rate")
    elif stats.fail_ratio < 0.05:
        print("    OK — Under 5% failure rate")
    else:
        print("   BAD — Over 5% failure rate, investigate!")

    print("=" * 55 + "\n")