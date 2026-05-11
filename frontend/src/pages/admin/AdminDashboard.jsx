import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users, Brain, Calculator, DollarSign,
  UserCheck, UserX, TrendingUp, FolderOpen,
  Crown, CreditCard, Clock, IndianRupee,
} from "lucide-react"
import { getAdminStats, getSubscriptionStats } from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colors = {
    cyan:   "bg-cyan-500/10   text-cyan-400   border-cyan-500/20",
    green:  "bg-green-500/10  text-green-400  border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    amber:  "bg-amber-500/10  text-amber-400  border-amber-500/20",
    red:    "bg-red-500/10    text-red-400    border-red-500/20",
    blue:   "bg-blue-500/10   text-blue-400   border-blue-500/20",
    pink:   "bg-pink-500/10   text-pink-400   border-pink-500/20",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`bg-slate-900 border rounded-xl p-6 ${colors[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}

// ── Plan Badge ────────────────────────────────────────────────────────────────
const PlanBadge = ({ planName }) => {
  const styles = {
    basic:    "bg-gray-500/10  text-gray-400   border border-gray-500/30",
    advanced: "bg-cyan-500/10  text-cyan-400   border border-cyan-500/30",
    extreme:  "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  }
  const labels = {
    basic:    "Basic",
    advanced: "Advanced",
    extreme:  "Extreme",
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[planName] || styles.basic}`}>
      {labels[planName] || planName}
    </span>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const SubStatusBadge = ({ status }) => {
  const styles = {
    active:    "bg-green-500/10  text-green-400",
    trial:     "bg-cyan-500/10   text-cyan-400",
    cancelled: "bg-amber-500/10  text-amber-400",
    expired:   "bg-red-500/10    text-red-400",
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || "bg-gray-500/10 text-gray-400"}`}>
      {status}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [subStats, setSubStats] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [statsRes, subRes] = await Promise.all([
        getAdminStats(),
        getSubscriptionStats(),
      ])
      setStats(statsRes.data)
      setSubStats(subRes.data)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
    setLoading(false)
  }

  const formatCost = (cost) => {
    if (!cost) return "₹0"
    const num = parseFloat(cost)
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
    if (num >= 100000)   return `₹${(num / 100000).toFixed(1)} L`
    if (num >= 1000)     return `₹${(num / 1000).toFixed(1)} K`
    return `₹${num.toLocaleString("en-IN")}`
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-white text-lg">Loading...</div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">System overview and statistics</p>
        </div>

        {/* ── System Stats ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Users"        value={stats?.users?.total || 0}          subtitle="Registered engineers"    icon={Users}      color="cyan"   />
            <StatCard title="Active Users"        value={stats?.users?.active || 0}         subtitle="Currently active"        icon={UserCheck}  color="green"  />
            <StatCard title="Inactive Users"      value={stats?.users?.inactive || 0}       subtitle="Deactivated accounts"    icon={UserX}      color="red"    />
            <StatCard title="AI Projects"         value={stats?.projects?.total_ai || 0}    subtitle="Floor plan analyses"     icon={Brain}      color="purple" />
            <StatCard title="Manual Estimations"  value={stats?.projects?.total_manual || 0} subtitle="Calculator estimates"   icon={Calculator} color="amber"  />
            <StatCard title="Total Cost Generated" value={formatCost(stats?.costs?.grand_total)} subtitle="Across all projects" icon={DollarSign} color="blue"   />
          </div>
        </div>

        {/* ── Subscription Stats ───────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-400" />
            Subscription Overview
          </h2>

          {/* Revenue + Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Revenue"
              value={formatCost(subStats?.revenue?.total)}
              subtitle="All paid subscriptions"
              icon={IndianRupee}
              color="green"
            />
            <StatCard
              title="Active Subscribers"
              value={subStats?.subscription_status?.active || 0}
              subtitle="Paid active plans"
              icon={Crown}
              color="purple"
            />
            <StatCard
              title="On Trial"
              value={subStats?.subscription_status?.trial || 0}
              subtitle="7-day free trials"
              icon={Clock}
              color="cyan"
            />
            <StatCard
              title="Cancelled"
              value={subStats?.subscription_status?.cancelled || 0}
              subtitle="Cancelled subscriptions"
              icon={CreditCard}
              color="amber"
            />
          </div>

          {/* Per Plan breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {subStats?.plan_stats?.map((plan) => (
              <motion.div
                key={plan.plan_name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900 border rounded-xl p-5 ${
                  plan.plan_name === "advanced"
                    ? "border-cyan-500/30"
                    : plan.plan_name === "extreme"
                    ? "border-purple-500/30"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${
                      plan.plan_name === "advanced" ? "text-cyan-400" :
                      plan.plan_name === "extreme"  ? "text-purple-400" :
                      "text-gray-400"
                    }`} />
                    <span className="text-white font-semibold">{plan.display_name}</span>
                  </div>
                  <span className={`text-2xl font-bold ${
                    plan.plan_name === "advanced" ? "text-cyan-400" :
                    plan.plan_name === "extreme"  ? "text-purple-400" :
                    "text-gray-300"
                  }`}>
                    {plan.user_count}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">
                  {plan.plan_name === "basic"
                    ? "Free plan users"
                    : `₹${plan.monthly_price}/mo · ₹${plan.yearly_price}/yr`}
                </p>
                <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      plan.plan_name === "advanced" ? "bg-cyan-500" :
                      plan.plan_name === "extreme"  ? "bg-purple-500" :
                      "bg-gray-600"
                    }`}
                    style={{
                      width: `${Math.min(100,
                        (plan.user_count /
                          Math.max(1, subStats?.plan_stats?.reduce((a, b) => a + b.user_count, 0))
                        ) * 100
                      )}%`
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Payments + Recent Subscriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Payments */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Recent Payments</h3>
              </div>

              {subStats?.recent_payments?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {subStats?.recent_payments?.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <span className="text-green-400 text-xs font-bold">
                            {p.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{p.username}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <PlanBadge planName={p.plan_name} />
                            <span className="text-gray-500 text-xs">{p.billing_cycle}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-sm">₹{p.amount}</p>
                        <p className="text-gray-500 text-xs">
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-IN") : "—"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Subscriptions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Recent Subscriptions</h3>
              </div>

              {subStats?.recent_subscriptions?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No subscriptions yet</p>
              ) : (
                <div className="space-y-3">
                  {subStats?.recent_subscriptions?.map((s, i) => (
                    <motion.div
                      key={`${s.user_id}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <span className="text-purple-400 text-xs font-bold">
                            {s.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{s.username}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <PlanBadge planName={s.plan_name} />
                            <SubStatusBadge status={s.status} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs capitalize">{s.billing_cycle}</p>
                        <p className="text-gray-500 text-xs">
                          {s.ends_at
                            ? `Ends ${new Date(s.ends_at).toLocaleDateString("en-IN")}`
                            : "No expiry"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Latest Users & Projects ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Latest Users */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Latest Users</h2>
            </div>
            <div className="space-y-3">
              {stats?.latest_users?.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-400 text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user.username}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.is_active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Latest Projects */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Latest Projects</h2>
            </div>
            <div className="space-y-3">
              {stats?.latest_projects?.slice(0, 5).map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      project.type === "ai" ? "bg-purple-500/10" : "bg-teal-500/10"
                    }`}>
                      {project.type === "ai"
                        ? <Brain className="w-4 h-4 text-purple-400" />
                        : <Calculator className="w-4 h-4 text-teal-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{project.name}</p>
                      <p className="text-gray-400 text-xs capitalize">{project.type}</p>
                    </div>
                  </div>
                  <p className="text-cyan-400 font-semibold text-sm">
                    {formatCost(project.cost)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}