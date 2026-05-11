import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Crown, X, Zap, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function UpgradePopup({
  open,
  onClose,
  title = "Limit Reached",
  message = "You have reached your plan limit. Upgrade to continue.",
}) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(open)

  useEffect(() => {
    setVisible(open)
  }, [open])

  const handleUpgrade = () => {
    onClose()
    navigate("/pricing")
  }

  return (
    <AnimatePresence>
      {visible && (
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

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-cyan-300" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center text-white mb-2">
                {title}
              </h2>

              {/* Message */}
              <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
                {message}
              </p>

              {/* Plan Comparison */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Basic */}
                <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
                  <div className="text-white font-bold text-sm mb-1">Basic</div>
                  <div className="text-gray-500 text-xs space-y-1">
                    <div>5 AI/month</div>
                    <div>3 3D/month</div>
                    <div>Manual PDF</div>
                  </div>
                </div>

                {/* Advanced */}
                <div className="p-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-center">
                  <div className="text-cyan-200 font-bold text-sm mb-1">Advanced</div>
                  <div className="text-gray-300 text-xs space-y-1">
                    <div>Unlimited AI</div>
                    <div>15 3D/month</div>
                    <div>All PDFs + GLB</div>
                  </div>
                  <div className="text-cyan-400 text-xs font-semibold mt-1">₹399/mo</div>
                </div>

                {/* Extreme */}
                <div className="p-3 rounded-xl border border-purple-400/30 bg-purple-500/10 text-center">
                  <div className="text-purple-200 font-bold text-sm mb-1">Extreme</div>
                  <div className="text-gray-300 text-xs space-y-1">
                    <div>Unlimited All</div>
                    <div>Unlimited 3D</div>
                    <div>All PDFs + GLB</div>
                  </div>
                  <div className="text-purple-400 text-xs font-semibold mt-1">₹699/mo</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade Now
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}