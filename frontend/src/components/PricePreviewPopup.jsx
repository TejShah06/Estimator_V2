import { motion, AnimatePresence } from "framer-motion"
import { X, Crown, ArrowRight, Tag, CreditCard } from "lucide-react"

export default function PricePreviewPopup({
  open,
  onClose,
  onConfirm,
  planName,
  billingCycle,
  originalPrice,
  credit,
  finalPrice,
  description,
}) {
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
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl shadow-2xl p-6">

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-cyan-300" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center text-white mb-1">
                Confirm Your Upgrade
              </h2>
              <p className="text-gray-400 text-center text-sm mb-6">
                {description}
              </p>

              {/* Price Breakdown */}
              <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 mb-6 space-y-3">

                {/* Plan */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-cyan-400" />
                    {planName} ({billingCycle})
                  </span>
                  <span className="text-white font-semibold">
                    ₹{originalPrice}
                  </span>
                </div>

                {/* Credit (only if > 0) */}
                {credit > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-400" />
                      Unused plan credit
                    </span>
                    <span className="text-green-400 font-semibold">
                      - ₹{Math.round(credit)}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/10" />

                {/* Final Price */}
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-base">
                    Amount to Pay
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    ₹{Math.round(finalPrice)}
                  </span>
                </div>

                {/* Savings badge */}
                {credit > 0 && (
                  <div className="flex items-center justify-center">
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      You save ₹{Math.round(credit)} from your current plan
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{Math.round(finalPrice)}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-center text-xs text-gray-600 mt-3">
                Secure payment via Razorpay
              </p>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}