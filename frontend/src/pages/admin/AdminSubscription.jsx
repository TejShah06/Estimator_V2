import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Crown, Search, CreditCard,
  Clock, CheckCircle, XCircle,
  IndianRupee, Users, TrendingUp,
} from "lucide-react"
import { getSubscriptionStats, getUsersWithSubs } from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

const PlanBadge = ({ planName }) => {
  const styles = {
    basic:    "bg-gray-500/10  text-gray-400   border border-gray-500/30",
    advanced: "bg-cyan-500/10  text-cyan-400   border border-cyan-500/30",
    extreme:  "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[planName] || styles.basic}`}>
      {planName}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const styles = {
    active:    "bg-green-500/10 text-green-400",
    trial:     "bg-cyan-500/10  text-cyan-400",
    cancelled: "bg-amber-500/10 text-amber-400",
    expired:   "bg-red-500/10   text-red-400",
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full ${styles[status] || "bg-gray-500/10 text-gray-400"}`}>
      {status}
    </span>
  )
}

export default function AdminSubscriptions() {
  const [stats,    setStats]    = useState(null)
  const [users,    setUsers]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [search,   setSearch]   = useState("")
  const [planFilter, setPlanFilter] = useState("")

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchUsers() }, [search, planFilter])

  const fetchStats = async () => {
    try {
      const res = await getSubscriptionStats()
      setStats(res.data)
    } catch (err) {
      console.error("Error fetching subscription stats:", err)
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await getUsersWithSubs({
        search: search     || undefined,
        plan:   planFilter || undefined,
      })
      setUsers(res.data.users)
      setTotal(res.data.total)
    } catch (err) {
      console.error("Error fetching users:", err)
    }
    setUsersLoading(false)
  }

  const formatCost = (cost) => {
    if (!cost) return "₹0"
    const num = parseFloat(cost)
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
    if (num >= 1000)   return `₹${(num / 1000).toFixed(1)} K`
    return `₹${num.toLocaleString("en-IN")}`
  }

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-400" />
            Subscription Management
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor plans, revenue and subscriber details
          </p>
        </div>

        {/* ── Revenue + Status Summary ───────────────────────────────────── */}
        {!loading && stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Revenue",
                  value: formatCost(stats.revenue?.total),
                  icon: IndianRupee,
                  color: "text-green-400",
                  bg: "bg-green-500/10 border-green-500/20",
                },
                {
                  label: "Active",
                  value: stats.subscription_status?.active || 0,
                  icon: CheckCircle,
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10 border-cyan-500/20",
                },
                {
                  label: "On Trial",
                  value: stats.subscription_status?.trial || 0,
                  icon: Clock,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-500/20",
                },
                {
                  label: "Cancelled",
                  value: stats.subscription_status?.cancelled || 0,
                  icon: XCircle,
                  color: "text-red-400",
                  bg: "bg-red-500/10 border-red-500/20",
                },
              ].map((card) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-slate-900 border rounded-xl p-5 ${card.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{card.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Per plan breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.plan_stats?.map((plan) => (
                <motion.div
                  key={plan.plan_name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-slate-900 border rounded-xl p-5 ${
                    plan.plan_name === "advanced" ? "border-cyan-500/30" :
                    plan.plan_name === "extreme"  ? "border-purple-500/30" :
                    "border-slate-800"
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
                    <span className={`text-3xl font-bold ${
                      plan.plan_name === "advanced" ? "text-cyan-400" :
                      plan.plan_name === "extreme"  ? "text-purple-400" :
                      "text-gray-300"
                    }`}>
                      {plan.user_count}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mb-3">
                    {plan.plan_name === "basic"
                      ? "Free plan — no revenue"
                      : `₹${plan.monthly_price}/month · ₹${plan.yearly_price}/year`}
                  </p>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        plan.plan_name === "advanced" ? "bg-cyan-500" :
                        plan.plan_name === "extreme"  ? "bg-purple-500" :
                        "bg-gray-600"
                      }`}
                      style={{
                        width: `${Math.min(100,
                          (plan.user_count /
                            Math.max(1, stats.plan_stats.reduce((a, b) => a + b.user_count, 0))
                          ) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-1 text-right">
                    {Math.round(
                      (plan.user_count /
                        Math.max(1, stats.plan_stats.reduce((a, b) => a + b.user_count, 0))
                      ) * 100
                    )}% of users
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Recent Payments ───────────────────────────────────────────── */}
        {!loading && stats?.recent_payments?.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-green-400" />
              <h2 className="text-white font-semibold">Recent Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">User</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Plan</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Cycle</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Payment ID</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_payments.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-800/50 hover:bg-slate-800/20"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white text-sm font-medium">{p.username}</p>
                          <p className="text-gray-500 text-xs">{p.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <PlanBadge planName={p.plan_name} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-300 text-sm capitalize">{p.billing_cycle}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-green-400 font-semibold">₹{p.amount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-400 text-xs font-mono">
                          {p.razorpay_payment_id || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-400 text-sm">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleDateString("en-IN")
                            : "—"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── All Users with Plans ──────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Users & Plans ({total})</h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="">All Plans</option>
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-4 px-6 text-gray-400 text-sm">User</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm hidden md:table-cell">Email</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm">Plan</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm">Status</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm hidden lg:table-cell">Billing</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm hidden lg:table-cell">Expires</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-800 rounded animate-pulse" /></td>
                    <td className="py-4 px-6 hidden md:table-cell"><div className="h-4 w-40 bg-slate-800 rounded animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-6 w-20 bg-slate-800 rounded animate-pulse mx-auto" /></td>
                    <td className="py-4 px-6"><div className="h-6 w-16 bg-slate-800 rounded animate-pulse mx-auto" /></td>
                    <td className="py-4 px-6 hidden lg:table-cell"><div className="h-4 w-16 bg-slate-800 rounded animate-pulse mx-auto" /></td>
                    <td className="py-4 px-6 hidden lg:table-cell"><div className="h-4 w-24 bg-slate-800 rounded animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-cyan-400 text-sm font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.username}</p>
                          <p className="text-gray-500 text-xs">{user.full_name || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <p className="text-gray-300 text-sm">{user.email}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <PlanBadge planName={user.subscription?.plan_name || "basic"} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge status={user.subscription?.status || "active"} />
                    </td>
                    <td className="py-4 px-6 text-center hidden lg:table-cell">
                      <span className="text-gray-400 text-sm capitalize">
                        {user.subscription?.billing_cycle || "—"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center hidden lg:table-cell">
                      <span className="text-gray-400 text-sm">
                        {user.subscription?.ends_at
                          ? new Date(user.subscription.ends_at).toLocaleDateString("en-IN")
                          : "—"}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  )
}