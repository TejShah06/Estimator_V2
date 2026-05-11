// src/pages/subscription/Pricing.jsx

import axios                             from "axios"
import { useEffect, useState }           from "react"
import { motion }                        from "framer-motion"
import { useNavigate }                   from "react-router-dom"
import MainLayout                        from "@/layout/MainLayout"
import { Crown, Check, Zap, Calendar, ChevronRight } from "lucide-react"

import {
  getPlans,
  createOrder,
  startTrial,
  getMyPlan,
  previewUpgrade,
}                                        from "@/services/subscriptionApi"
import { getToken }                      from "@/utils/auth"
import PaymentResultPopup                from "@/components/PaymentResult"
import PricePreviewPopup                 from "@/components/PricePreviewPopup"


// ══════════════════════════════════════════════════════════════════════════════
// RAZORPAY SCRIPT LOADER
// ══════════════════════════════════════════════════════════════════════════════
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }

    const script    = document.createElement("script")
    script.src      = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload   = () => resolve(true)
    script.onerror  = () => resolve(false)
    document.body.appendChild(script)
  })
}


// ══════════════════════════════════════════════════════════════════════════════
// PRICING PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Pricing() {
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────────────────────
  const [plans,        setPlans]        = useState([])
  const [myPlan,       setMyPlan]       = useState(null)
  const [loadingPlan,  setLoadingPlan]  = useState(null)
  const [razorpayKey,  setRazorpayKey]  = useState("")
  const [pageLoading,  setPageLoading]  = useState(true)
  const [error,        setError]        = useState(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Payment result popup
  const [paymentResult, setPaymentResult] = useState({
    open:         false,
    success:      false,
    planName:     "",
    billingCycle: "",
    amount:       null,
    orderId:      "",
  })

  // Price preview popup (shows before Razorpay opens)
  const [pricePreview, setPricePreview] = useState({
    open:          false,
    planName:      "",
    billingCycle:  "",
    originalPrice: 0,
    credit:        0,
    finalPrice:    0,
    description:   "",
  })


  // ══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ══════════════════════════════════════════════════════════════════════════

  // Load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      if (loaded) {
        setScriptLoaded(true)
        console.log("Razorpay script loaded")
      } else {
        console.error("Failed to load Razorpay script")
      }
    })
  }, [])

  // Load plans + current subscription
  useEffect(() => {
    loadData()
  }, [])


  // ══════════════════════════════════════════════════════════════════════════
  // DATA LOADERS
  // ══════════════════════════════════════════════════════════════════════════

  const loadData = async () => {
    try {
      setPageLoading(true)
      setError(null)

      const token = getToken()

      if (token) {
        const [plansRes, myRes] = await Promise.all([getPlans(), getMyPlan()])
        setPlans(plansRes.data.plans)
        setRazorpayKey(plansRes.data.razorpay_key_id)
        setMyPlan(myRes.data.subscription)
      } else {
        const plansRes = await getPlans()
        setPlans(plansRes.data.plans)
        setRazorpayKey(plansRes.data.razorpay_key_id)
      }
    } catch (err) {
      console.error("Failed to load plans:", err)
      setError("Failed to load pricing. Please refresh.")
    } finally {
      setPageLoading(false)
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Start 7-day free trial ─────────────────────────────────────────────
  const handleStartTrial = async (planName) => {
    const token = getToken()
    if (!token) { navigate("/login"); return }

    try {
      setLoadingPlan(`${planName}-trial`)
      const res = await startTrial(planName)
      alert(res.data.message || "7-day free trial started!")
      const myRes = await getMyPlan()
      setMyPlan(myRes.data.subscription)
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg    = typeof detail === "string"
        ? detail
        : detail?.message || "Failed to start trial"
      alert(msg)
    } finally {
      setLoadingPlan(null)
    }
  }

  // ── Show price preview popup before payment ────────────────────────────
  const handleBuyClick = async (planName, billingCycle) => {
    const token = getToken()
    if (!token) { navigate("/login"); return }

    try {
      setLoadingPlan(`${planName}-${billingCycle}`)

      const res     = await previewUpgrade({ plan_name: planName, billing_cycle: billingCycle })
      const pricing = res.data

      setPricePreview({
        open:          true,
        planName:      pricing.new_plan,
        billingCycle:  pricing.billing_cycle,
        originalPrice: pricing.new_plan_price,
        credit:        pricing.credit,
        finalPrice:    pricing.final_price,
        description:   pricing.description,
      })

    } catch (err) {
      console.error("Price preview failed:", err)
      const detail = err.response?.data?.detail
      const msg    = typeof detail === "string"
        ? detail
        : "Failed to calculate price. Please try again."
      alert(msg)
    } finally {
      setLoadingPlan(null)
    }
  }

  // ── Confirmed from preview popup → open Razorpay ───────────────────────
  const confirmPurchase = () => {
    setPricePreview(prev => ({ ...prev, open: false }))
    handlePurchase(
      pricePreview.planName.toLowerCase(),
      pricePreview.billingCycle,
    )
  }

  // ── Open Razorpay checkout ─────────────────────────────────────────────
  const handlePurchase = async (planName, billingCycle) => {
    const token = getToken()
    if (!token) { navigate("/login"); return }

    // Ensure Razorpay script is loaded
    if (!window.Razorpay) {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        alert("Payment system failed to load. Please refresh and try again.")
        return
      }
    }

    try {
      setLoadingPlan(`${planName}-${billingCycle}`)

      const orderRes = await createOrder({
        plan_name:     planName,
        billing_cycle: billingCycle,
      })

      const { order_id, amount, currency, razorpay_key_id } = orderRes.data

      // Capture in closure for Razorpay handler
      const capturedPlanName     = planName
      const capturedBillingCycle = billingCycle
      const capturedToken        = token
      const capturedAmount       = amount / 100   // paise → rupees

      const options = {
        key:         razorpay_key_id || razorpayKey || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name:        "AI Smart Estimator",
        description: `${capturedPlanName} plan (${capturedBillingCycle})`,
        order_id,

        // Payment success handler
        handler: async function (response) {
          try {
            // Verify payment on backend with explicit token
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/subscription/verify-payment`,
              {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                plan_name:           capturedPlanName,
                billing_cycle:       capturedBillingCycle,
              },
              {
                headers: {
                  Authorization:  `Bearer ${capturedToken}`,
                  "Content-Type": "application/json",
                },
              }
            )

            // Show success popup
            setPaymentResult({
              open:         true,
              success:      true,
              planName:     capturedPlanName,
              billingCycle: capturedBillingCycle,
              amount:       capturedAmount,
              orderId:      response.razorpay_order_id,
            })

            // Refresh subscription status
            const myRes = await getMyPlan()
            setMyPlan(myRes.data.subscription)

          } catch (e) {
            console.error("Payment verification failed:", e)

            // Show failure popup
            setPaymentResult({
              open:         true,
              success:      false,
              planName:     capturedPlanName,
              billingCycle: capturedBillingCycle,
              amount:       null,
              orderId:      response.razorpay_order_id,
            })
          }
        },

        prefill: {},
        theme:   { color: "#06b6d4" },

        modal: {
          ondismiss: () => {
            console.log("Razorpay modal closed")
            setLoadingPlan(null)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error("Order creation failed:", err)
      const detail = err.response?.data?.detail
      const msg    = typeof detail === "string"
        ? detail
        : detail?.message || "Failed to create order. Please try again."
      alert(msg)
      setLoadingPlan(null)
    }
  }


  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  const isCurrentPlan = (planName) =>
    myPlan?.plan_name === planName && myPlan?.status === "active"

  const isOnTrial = (planName) =>
    myPlan?.plan_name === planName && myPlan?.status === "trial"


  // ══════════════════════════════════════════════════════════════════════════
  // LOADING SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (pageLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading plans...</p>
          </div>
        </div>
      </MainLayout>
    )
  }


  // ══════════════════════════════════════════════════════════════════════════
  // ERROR SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
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


  // ══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Crown className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300">Simple Pricing</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                Choose Your Plan
              </span>
            </h1>

            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start free, upgrade when you need more power.
              All plans include unlimited manual estimation.
            </p>

            {/* Current plan badge */}
            {myPlan && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                <span className="text-gray-400">Current plan:</span>
                <span className="text-white font-semibold">{myPlan.display_name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  myPlan.status === "active" ? "bg-green-500/20 text-green-300" :
                  myPlan.status === "trial"  ? "bg-cyan-500/20  text-cyan-300"  :
                                               "bg-amber-500/20 text-amber-300"
                }`}>
                  {myPlan.status}
                </span>
              </div>
            )}

            {/* Razorpay loading indicator */}
            {!scriptLoaded && (
              <div className="mt-3 text-xs text-amber-400">
                Loading payment system...
              </div>
            )}
          </motion.div>
        </div>


        {/* ── Plan Cards ──────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const isBasic    = plan.name === "basic"
              const isAdvanced = plan.name === "advanced"
              const isExtreme  = plan.name === "extreme"
              const popular    = isAdvanced

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="relative"
                >
                  {/* Popular badge */}
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                        <Crown className="w-3 h-3" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  <div className={`h-full rounded-2xl border ${
                    popular   ? "border-cyan-400/50 shadow-2xl shadow-cyan-500/20" :
                    isExtreme ? "border-purple-400/30" :
                                "border-white/10"
                  } bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl overflow-hidden`}>

                    {/* ── Plan Header ─────────────────────────────────── */}
                    <div className={`p-6 border-b ${
                      isBasic    ? "border-white/10" :
                      isAdvanced ? "border-cyan-400/20   bg-cyan-500/5"   :
                                   "border-purple-400/20 bg-purple-500/5"
                    }`}>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {plan.display_name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {plan.description}
                      </p>

                      {/* Price */}
                      {isBasic ? (
                        <div>
                          <span className="text-4xl font-bold text-white">₹0</span>
                          <span className="text-gray-400 text-sm ml-1">/ forever</span>
                        </div>
                      ) : (
                        <div>
                          <div>
                            <span className="text-4xl font-bold text-white">
                              ₹{plan.monthly_price}
                            </span>
                            <span className="text-gray-400 text-sm ml-1">/month</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            or{" "}
                            <span className="text-green-400 font-medium">
                              ₹{plan.yearly_price}/year
                            </span>
                            {" "}(save ~17%)
                          </div>
                          <div className="text-xs text-cyan-400 mt-1 font-medium">
                            7-day free trial
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Features List ───────────────────────────────── */}
                    <div className="p-6">
                      <ul className="space-y-3 mb-6">

                        <li className="flex items-center gap-3 text-sm">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">
                            <strong className="text-white">
                              {plan.ai_analyses_limit === -1 ? "Unlimited" : plan.ai_analyses_limit}
                            </strong>{" "}AI analyses / month
                          </span>
                        </li>

                        <li className="flex items-center gap-3 text-sm">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">
                            <strong className="text-white">
                              {plan.three_d_limit === -1 ? "Unlimited" : plan.three_d_limit}
                            </strong>{" "}3D renders / month
                          </span>
                        </li>

                        <li className="flex items-center gap-3 text-sm">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">
                            <strong className="text-white">Unlimited</strong> manual estimation
                          </span>
                        </li>

                        <li className="flex items-center gap-3 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 ${
                            plan.can_download_manual_pdf ? "text-green-400" : "text-gray-600"
                          }`} />
                          <span className={plan.can_download_manual_pdf ? "text-gray-300" : "text-gray-600"}>
                            Manual PDF download
                          </span>
                        </li>

                        <li className="flex items-center gap-3 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 ${
                            plan.can_download_ai_pdf ? "text-green-400" : "text-gray-600"
                          }`} />
                          <span className={plan.can_download_ai_pdf ? "text-gray-300" : "text-gray-600"}>
                            AI Report PDF download
                          </span>
                        </li>

                        <li className="flex items-center gap-3 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 ${
                            plan.can_download_3d_glb ? "text-green-400" : "text-gray-600"
                          }`} />
                          <span className={plan.can_download_3d_glb ? "text-gray-300" : "text-gray-600"}>
                            3D GLB file download
                          </span>
                        </li>

                      </ul>

                      {/* ── CTA Buttons ─────────────────────────────── */}

                      {/* Basic Plan */}
                      {isBasic && (
                        <button
                          onClick={() => navigate(getToken() ? "/dashboard" : "/register")}
                          className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                        >
                          {isCurrentPlan("basic") ? "Current Plan" : "Get Started Free"}
                        </button>
                      )}

                      {/* Advanced Plan */}
                      {isAdvanced && (
                        <div className="space-y-2">
                          {isCurrentPlan("advanced") ? (
                            <button
                              disabled
                              className="w-full py-3 rounded-xl bg-cyan-600/30 text-cyan-300 cursor-not-allowed text-sm font-medium border border-cyan-500/30"
                            >
                              Current Plan (Advanced)
                            </button>

                          ) : isOnTrial("advanced") ? (
                            <button
                              disabled
                              className="w-full py-3 rounded-xl bg-cyan-600/30 text-cyan-300 cursor-not-allowed text-sm font-medium border border-cyan-500/30"
                            >
                              On 7-Day Trial (Advanced)
                            </button>

                          ) : (
                            <>
                              {/* Trial */}
                              <button
                                onClick={() => handleStartTrial("advanced")}
                                disabled={loadingPlan === "advanced-trial"}
                                className="w-full py-2.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                              >
                                <Calendar className="w-4 h-4" />
                                {loadingPlan === "advanced-trial"
                                  ? "Starting..."
                                  : "Start 7-Day Free Trial"}
                              </button>

                              {/* Monthly */}
                              <button
                                onClick={() => handleBuyClick("advanced", "monthly")}
                                disabled={!!loadingPlan || !scriptLoaded}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/25"
                              >
                                <Zap className="w-4 h-4" />
                                {loadingPlan === "advanced-monthly"
                                  ? "Processing..."
                                  : "Buy ₹399/month"}
                              </button>

                              {/* Yearly */}
                              <button
                                onClick={() => handleBuyClick("advanced", "yearly")}
                                disabled={!!loadingPlan || !scriptLoaded}
                                className="w-full py-2.5 rounded-xl border border-cyan-400/20 hover:bg-cyan-500/10 text-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                {loadingPlan === "advanced-yearly"
                                  ? "Processing..."
                                  : "Buy ₹3,999/year (save 17%)"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Extreme Plan */}
                      {isExtreme && (
                        <div className="space-y-2">
                          {isCurrentPlan("extreme") ? (
                            <button
                              disabled
                              className="w-full py-3 rounded-xl bg-purple-600/30 text-purple-300 cursor-not-allowed text-sm font-medium border border-purple-500/30"
                            >
                              Current Plan (Extreme)
                            </button>

                          ) : isOnTrial("extreme") ? (
                            <button
                              disabled
                              className="w-full py-3 rounded-xl bg-purple-600/30 text-purple-300 cursor-not-allowed text-sm font-medium border border-purple-500/30"
                            >
                              On 7-Day Trial (Extreme)
                            </button>

                          ) : (
                            <>
                              {/* Trial */}
                              <button
                                onClick={() => handleStartTrial("extreme")}
                                disabled={loadingPlan === "extreme-trial"}
                                className="w-full py-2.5 rounded-xl border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                              >
                                <Calendar className="w-4 h-4" />
                                {loadingPlan === "extreme-trial"
                                  ? "Starting..."
                                  : "Start 7-Day Free Trial"}
                              </button>

                              {/* Monthly */}
                              <button
                                onClick={() => handleBuyClick("extreme", "monthly")}
                                disabled={!!loadingPlan || !scriptLoaded}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
                              >
                                <Zap className="w-4 h-4" />
                                {loadingPlan === "extreme-monthly"
                                  ? "Processing..."
                                  : "Buy ₹699/month"}
                              </button>

                              {/* Yearly */}
                              <button
                                onClick={() => handleBuyClick("extreme", "yearly")}
                                disabled={!!loadingPlan || !scriptLoaded}
                                className="w-full py-2.5 rounded-xl border border-purple-400/20 hover:bg-purple-500/10 text-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                {loadingPlan === "extreme-yearly"
                                  ? "Processing..."
                                  : "Buy ₹6,999/year (save 17%)"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Manage subscription link */}
          {myPlan && getToken() && (
            <div className="text-center mt-8">
              <button
                onClick={() => navigate("/subscription")}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 text-sm transition-colors"
              >
                Manage your subscription
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Price Preview Popup ────────────────────────────────────────── */}
      <PricePreviewPopup
        open={pricePreview.open}
        onClose={() => setPricePreview(prev => ({ ...prev, open: false }))}
        onConfirm={confirmPurchase}
        planName={pricePreview.planName}
        billingCycle={pricePreview.billingCycle}
        originalPrice={pricePreview.originalPrice}
        credit={pricePreview.credit}
        finalPrice={pricePreview.finalPrice}
        description={pricePreview.description}
      />

      {/* ── Payment Result Popup ───────────────────────────────────────── */}
      <PaymentResultPopup
        open={paymentResult.open}
        success={paymentResult.success}
        planName={paymentResult.planName}
        billingCycle={paymentResult.billingCycle}
        amount={paymentResult.amount}
        orderId={paymentResult.orderId}
        onClose={() => setPaymentResult(prev => ({ ...prev, open: false }))}
      />

    </MainLayout>
  )
}