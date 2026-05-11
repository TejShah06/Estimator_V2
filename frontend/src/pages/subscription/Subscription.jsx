import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import MainLayout from "@/layout/MainLayout"
import { Crown, CreditCard, AlertTriangle, ArrowLeft } from "lucide-react"
import {
  getMyPlan,
  getPaymentHistory,
  cancelSubscription,
} from "@/services/subscriptionApi"

export default function Subscription() {
  const navigate  = useNavigate()
  const [myPlan, setMyPlan]         = useState(null)
  const [usage, setUsage]           = useState(null)
  const [permissions, setPermissions] = useState(null)
  const [payments, setPayments]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [planRes, payRes] = await Promise.all([
        getMyPlan(),
        getPaymentHistory(),
      ])
      setMyPlan(planRes.data.subscription)
      setUsage(planRes.data.usage)
      setPermissions(planRes.data.permissions)
      setPayments(payRes.data.payments)
    } catch (err) {
      console.error("Failed to load subscription:", err)
      setError("Failed to load subscription details. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── Cancel Subscription ────────────────────────────────────────────────────
  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel? You will keep access until your billing period ends."
    )
    if (!confirmed) return

    try {
      setCancelling(true)
      const res = await cancelSubscription()
      alert(res.data.message || "Subscription cancelled.")
      await loadData()
    } catch (err) {
      console.error("Cancel failed:", err)
      alert("Failed to cancel subscription. Please try again.")
    } finally {
      setCancelling(false)
    }
  }

  // ── Usage Bar Component ────────────────────────────────────────────────────
  const UsageBar = ({ label, current, limit, color }) => {
    const isUnlimited = limit === -1
    const pct = isUnlimited
      ? 100
      : Math.min(100, ((current || 0) / (limit || 1)) * 100)

    return (
      <div>
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="text-white font-semibold">
            {isUnlimited
              ? "Unlimited"
              : `${current ?? 0} / ${limit ?? 0}`}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${color}`}
          />
        </div>
        {!isUnlimited && (
          <p className="text-xs text-gray-600 mt-1">
            {(limit || 0) - (current || 0)} remaining this period
          </p>
        )}
      </div>
    )
  }

  // ── Permission Badge ───────────────────────────────────────────────────────
  const PermissionCard = ({ label, allowed }) => (
    <div className={`p-4 rounded-xl border ${
      allowed
        ? "border-green-400/30 bg-green-500/10"
        : "border-gray-600/30 bg-gray-800/30"
    }`}>
      <div className="font-semibold text-white text-sm mb-1">{label}</div>
      <div className={`text-sm ${allowed ? "text-green-300" : "text-gray-500"}`}>
        {allowed ? "   Allowed" : "✗ Upgrade required"}
      </div>
    </div>
  )

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading subscription...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 space-y-6">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Crown className="w-6 h-6 text-cyan-300" />
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  My Subscription
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Manage your plan, usage and billing
              </p>
            </div>
          </motion.div>

          {/* ── Current Plan ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4">Current Plan</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-gray-400 text-xs mb-1">Plan</p>
                <p className="text-xl font-bold text-white">{myPlan?.display_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  myPlan?.status === "active"
                    ? "bg-green-500/20 text-green-300"
                    : myPlan?.status === "trial"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}>
                  {myPlan?.status?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Started</p>
                <p className="text-white text-sm">
                  {myPlan?.starts_at
                    ? new Date(myPlan.starts_at).toLocaleDateString("en-IN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">
                  {myPlan?.is_trial ? "Trial Ends" : "Renews"}
                </p>
                <p className="text-white text-sm">
                  {myPlan?.ends_at
                    ? new Date(myPlan.ends_at).toLocaleDateString("en-IN")
                    : "Never"}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/pricing")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-semibold transition-all"
              >
                {myPlan?.plan_name === "basic" ? "Upgrade Plan" : "Change Plan"}
              </button>

              {myPlan?.plan_name !== "basic" && myPlan?.status !== "cancelled" && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl border border-red-400/30 hover:bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {cancelling ? "Cancelling..." : "Cancel Subscription"}
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Usage ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4">
              Usage (Rolling 30 Days)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UsageBar
                label="AI Analyses"
                current={usage?.ai_analysis?.current}
                limit={usage?.ai_analysis?.limit}
                color="bg-gradient-to-r from-cyan-500 to-blue-500"
              />
              <UsageBar
                label="3D Renders"
                current={usage?.three_d?.current}
                limit={usage?.three_d?.limit}
                color="bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </motion.div>

          {/* ── Download Permissions ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4">
              Download Permissions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PermissionCard
                label="AI Report PDF"
                allowed={permissions?.can_download_ai_pdf}
              />
              <PermissionCard
                label="Manual Report PDF"
                allowed={permissions?.can_download_manual_pdf}
              />
              <PermissionCard
                label="3D GLB File"
                allowed={permissions?.can_download_3d_glb}
              />
            </div>
          </motion.div>

          {/* ── Payment History ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-300" />
              Payment History
            </h2>

            {payments.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No payments yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">
                        {p.plan_name} — {p.billing_cycle} — ₹{p.amount}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleString("en-IN")
                          : "—"}
                        {p.razorpay_order_id && ` · ${p.razorpay_order_id}`}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      p.status === "paid"
                        ? "bg-green-500/20 text-green-300"
                        : p.status === "failed"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </MainLayout>
  )
}