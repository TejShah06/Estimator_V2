import { motion } from "framer-motion"
import CountUp from "react-countup"
import {
  FolderOpen,
  Brain,
  Calculator,
  IndianRupee,
  Ruler,
  DoorOpen
} from "lucide-react"

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  })
}

const formatCost = (value) => {
  if (!value) return "0"
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}

const StatCard = ({ icon: Icon, label, value, prefix, suffix, color, index, loading }) => {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -4,
        boxShadow: "0 12px 24px -8px rgba(0,0,0,0.15)"
      }}
      className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer
                 transition-colors hover:border-blue-200"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 font-medium">
            {label}
          </p>

          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              {prefix && (
                <span className="text-lg">{prefix}</span>
              )}

              <CountUp
                end={value || 0}
                duration={2}
                separator=","
                decimals={suffix === "L" || suffix === "Cr" ? 1 : 0}
              />

              {suffix && (
                <span className="text-sm font-medium text-gray-400">
                  {suffix}
                </span>
              )}
            </h2>
          )}
        </div>

        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={`p-3 rounded-xl ${color}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* Mini progress bar */}
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value || 0) * 10, 100)}%` }}
          transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
          className={`h-full rounded-full ${color.replace("bg-", "bg-")}`}
        />
      </div>
    </motion.div>
  )
}

const StatsCards = ({ stats, loading }) => {
  const cards = [
    {
      icon: FolderOpen,
      label: "Total Projects",
      value: stats.total_projects,
      color: "bg-blue-500",
    },
    {
      icon: Brain,
      label: "AI Estimates",
      value: stats.ai_projects,
      color: "bg-purple-500",
    },
    {
      icon: Calculator,
      label: "Manual Estimates",
      value: stats.manual_projects,
      color: "bg-teal-500",
    },
    {
      icon: IndianRupee,
      label: "Total Cost",
      value: parseFloat(formatCost(stats.total_cost)),
      prefix: "₹",
      suffix: stats.total_cost >= 10000000 ? "Cr" :
              stats.total_cost >= 100000 ? "L" :
              stats.total_cost >= 1000 ? "K" : "",
      color: "bg-amber-500",
    },
    {
      icon: Ruler,
      label: "Area Analyzed",
      value: stats.total_area_sqft || 0,
      suffix: "sqft",
      color: "bg-green-500",
    },
    {
      icon: DoorOpen,
      label: "Rooms Detected",
      value: stats.total_rooms || 0,
      color: "bg-rose-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.label}
          {...card}
          index={index}
          loading={loading}
        />
      ))}
    </div>
  )
}

export default StatsCards