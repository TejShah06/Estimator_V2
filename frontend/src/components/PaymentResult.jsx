import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, X, Crown, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function PaymentResultPopup({
  open,
  onClose,
  success,
  planName,
  billingCycle,
  amount,
  orderId,
}) {
  const navigate = useNavigate()

  const handleManageSubscription = () => {
    onClose()
    navigate("/subscription")
  }

  const handleTryAgain = () => {
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(2, 6, 23, 0.85)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative rounded-2xl border shadow-2xl p-6 ${
              success
                ? "bg-gradient-to-br from-slate-900 to-slate-800 border-green-500/30"
                : "bg-gradient-to-br from-slate-900 to-slate-800 border-red-500/30"
            }`}>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                {success ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, damping: 10 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, damping: 10 }}
                    className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400/40 flex items-center justify-center"
                  >
                    <XCircle className="w-10 h-10 text-red-400" />
                  </motion.div>
                )}
              </div>

              {/* Title */}
              <h2 className={`text-2xl font-bold text-center mb-2 ${
                success ? "text-green-300" : "text-red-300"
              }`}>
                {success ? "Payment Successful!" : "Payment Failed"}
              </h2>

              {/* Subtitle */}
              <p className="text-gray-400 text-center text-sm mb-6">
                {success
                  ? "Your subscription has been activated. Enjoy your new plan!"
                  : "Something went wrong with your payment. Please try again."}
              </p>

              {/* Details Card */}
              {success ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 space-y-2">
                  {planName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Plan</span>
                      <span className="text-white font-semibold capitalize flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-cyan-400" />
                        {planName}
                      </span>
                    </div>
                  )}
                  {billingCycle && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Billing</span>
                      <span className="text-white font-semibold capitalize">{billingCycle}</span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Amount Paid</span>
                      <span className="text-green-400 font-bold text-base">₹{amount}</span>
                    </div>
                  )}
                  {orderId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Order ID</span>
                      <span className="text-gray-300 text-xs font-mono">{orderId}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-300 text-center">
                    Your payment was not processed. No amount has been charged.
                    {orderId && (
                      <span className="block mt-1 text-xs text-gray-500">
                        Reference: {orderId}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {success ? (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
                  >
                    Continue
                  </button>
                  <button
                    onClick={handleManageSubscription}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    My Subscription
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}