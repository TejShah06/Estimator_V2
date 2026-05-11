import { motion }   from "framer-motion"
import CountUp      from "react-countup"
import {
  FolderOpen, Brain, Calculator,
  IndianRupee, Ruler, DoorOpen,
} from "lucide-react"

const cardVariants = {
  hidden:  { opacity: 0, y: 30, scale: 0.9 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 },
  }),
}

const formatCostData = (totalCost) => {
  if (!totalCost)               return { num: 0,                  suffix: ""   }
  if (totalCost >= 10000000)    return { num: totalCost / 10000000, suffix: "Cr" }
  if (totalCost >= 100000)      return { num: totalCost / 100000,   suffix: "L"  }
  if (totalCost >= 1000)        return { num: totalCost / 1000,     suffix: "K"  }
  return { num: totalCost, suffix: "" }
}

// ── Color configs ─────────────────────────────────────────────────────────────
const colorMap = {
  "bg-blue-500":   { icon: "from-blue-500/20   to-cyan-500/20   border-blue-400/20   text-blue-400",   bar: "from-blue-500   to-cyan-500"   },
  "bg-purple-500": { icon: "from-purple-500/20 to-pink-500/20   border-purple-400/20 text-purple-400", bar: "from-purple-500 to-pink-500"   },
  "bg-teal-500":   { icon: "from-teal-500/20   to-green-500/20  border-teal-400/20   text-teal-400",   bar: "from-teal-500   to-green-500"  },
  "bg-amber-500":  { icon: "from-amber-500/20  to-orange-500/20 border-amber-400/20  text-amber-400",  bar: "from-amber-500  to-orange-500" },
  "bg-green-500":  { icon: "from-green-500/20  to-emerald-500/20 border-green-400/20 text-green-400",  bar: "from-green-500  to-emerald-500"},
  "bg-rose-500":   { icon: "from-rose-500/20   to-red-500/20    border-rose-400/20   text-rose-400",   bar: "from-rose-500   to-red-500"    },
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, prefix, suffix, color, index, loading }) => {
  const colors = colorMap[color] || colorMap["bg-blue-500"]

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl
                 border border-white/10 rounded-2xl p-5 cursor-pointer
                 hover:border-white/20 transition-all shadow-lg"
    >
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.icon}
                         border flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.icon.split(" ").find(c => c.startsWith("text-"))}`} />
        </div>
      </div>

      {/* Label */}
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-20 bg-white/5 border border-white/5 rounded-lg animate-pulse" />
      ) : (
        <h2 className="text-2xl font-bold text-white flex items-end gap-1">
          {prefix && <span className="text-lg text-gray-400">{prefix}</span>}
          <CountUp
            end={value || 0}
            duration={2}
            separator=","
            decimals={suffix === "L" || suffix === "Cr" ? 1 : 0}
          />
          {suffix && (
            <span className="text-sm font-medium text-gray-500 mb-0.5">{suffix}</span>
          )}
        </h2>
      )}

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value || 0) * 10, 100)}%` }}
          transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
          className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
        />
      </div>
    </motion.div>
  )
}

// ── Stats Cards Grid ──────────────────────────────────────────────────────────
const StatsCards = ({ stats, loading }) => {
  const safeStats = stats || {
    total_projects: 0, ai_projects: 0, manual_projects: 0,
    total_estimated_cost: 0, total_area_sqft: 0, total_rooms: 0,
  }

  const costData = formatCostData(
    safeStats.total_estimated_cost || safeStats.total_cost || 0
  )

  const cards = [
    { icon: FolderOpen,  label: "Total Projects",    value: safeStats.total_projects,              color: "bg-blue-500"   },
    { icon: Brain,       label: "AI Estimates",       value: safeStats.ai_projects,                 color: "bg-purple-500" },
    { icon: Calculator,  label: "Manual Estimates",   value: safeStats.manual_projects,             color: "bg-teal-500"   },
    { icon: IndianRupee, label: "Total Cost",         value: costData.num, prefix: "₹", suffix: costData.suffix, color: "bg-amber-500" },
    { icon: Ruler,       label: "Total Area",         value: safeStats.total_area_sqft || 0, suffix: "sqft", color: "bg-green-500" },
    { icon: DoorOpen,    label: "Rooms Found",        value: safeStats.total_rooms || 0,            color: "bg-rose-500"   },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} index={index} loading={loading} />
      ))}
    </div>
  )
}

export default StatsCards