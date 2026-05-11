import { motion }      from "framer-motion"
import { useState }    from "react"
import {
  AreaChart, Area,
  BarChart,  Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, BarChart3 } from "lucide-react"
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl shadow-black/40">
      <p className="text-xs font-semibold text-gray-300 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <p className="text-xs text-gray-400">
            {entry.name}:{" "}
            <span className="text-white font-semibold">
              ₹{(entry.value / 100000).toFixed(1)}L
            </span>
          </p>
        </div>
      ))}
    </div>
  )
}
const CostTrendChart = ({ projects }) => {
  const [chartType, setChartType] = useState("area")

  // ── Transform projects data ───────────────────────────────────────────────
  const chartData = projects.slice(0, 10).reverse().map((p, i) => ({
    name:  p.project_name || `Project ${i + 1}`,
    cost:  parseFloat(p.estimated_cost) || 0,
    area:  parseFloat(p.total_area)     || 0,
    rooms: parseInt(p.rooms_count)      || 0,
    type:  p.source_type,
  }))

  // ── Sample data when no projects ──────────────────────────────────────────
  const sampleData = [
    { name: "Plan 1", cost: 850000,  area: 1200, rooms: 4 },
    { name: "Plan 2", cost: 1250000, area: 1850, rooms: 6 },
    { name: "Plan 3", cost: 780000,  area: 950,  rooms: 3 },
    { name: "Plan 4", cost: 1580000, area: 2100, rooms: 7 },
    { name: "Plan 5", cost: 920000,  area: 1100, rooms: 5 },
    { name: "Plan 6", cost: 1100000, area: 1500, rooms: 5 },
  ]

  const data   = chartData.length > 0 ? chartData : sampleData
  const isDemo = chartData.length === 0

  // ── Computed stats ────────────────────────────────────────────────────────
  const avgCost     = data.reduce((a, b) => a + b.cost, 0) / data.length
  const highestCost = Math.max(...data.map(d => d.cost))
  const lowestCost  = Math.min(...data.map(d => d.cost))

  // ── Shared axis styles ────────────────────────────────────────────────────
  const axisStyle = { fontSize: 11, fill: "#64748b" }
  const axisLine  = { stroke: "#1e293b" }
  const gridStyle = { strokeDasharray: "3 3", stroke: "#1e293b" }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
    >

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-base font-semibold text-white">Cost Trend</h2>
            <p className="text-xs text-gray-500">
              {isDemo ? "Sample data" : `Last ${data.length} projects`}
            </p>
          </div>

          {/* Demo badge */}
          {isDemo && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full">
              Sample Data
            </span>
          )}
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center gap-1 bg-slate-800/80 border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => setChartType("area")}
            title="Area Chart"
            className={`p-1.5 rounded-lg transition-all ${
              chartType === "area"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            title="Bar Chart"
            className={`p-1.5 rounded-lg transition-all ${
              chartType === "bar"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">

          {chartType === "area" ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
                </linearGradient>
              </defs>

              <CartesianGrid {...gridStyle} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                axisLine={axisLine}
                tickLine={false}
              />
              <YAxis
                tick={axisStyle}
                axisLine={axisLine}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cost"
                name="Estimated Cost"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#costGradient)"
                dot={{ fill: "#06b6d4", strokeWidth: 0, r: 3 }}
                activeDot={{ fill: "#06b6d4", stroke: "#0f172a", strokeWidth: 2, r: 5 }}
              />
            </AreaChart>

          ) : (
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid {...gridStyle} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                axisLine={axisLine}
                tickLine={false}
              />
              <YAxis
                tick={axisStyle}
                axisLine={axisLine}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: "12px" }}
              />
              <Bar
                dataKey="cost"
                name="Cost (₹)"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}

        </ResponsiveContainer>
      </div>

      {/* ── Bottom Stats ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-5 pt-5 border-t border-white/5">

        {/* Three stat boxes */}
        <div className="flex items-center gap-4">

          {/* Avg */}
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Avg Cost</p>
            <p className="text-sm font-bold text-white">
              ₹{(avgCost / 100000).toFixed(1)}L
            </p>
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Highest */}
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Highest</p>
            <p className="text-sm font-bold text-cyan-400">
              ₹{(highestCost / 100000).toFixed(1)}L
            </p>
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Lowest */}
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Lowest</p>
            <p className="text-sm font-bold text-purple-400">
              ₹{(lowestCost / 100000).toFixed(1)}L
            </p>
          </div>

        </div>

        {/* Trend badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-semibold text-green-400">+12.5%</span>
        </div>

      </div>
    </motion.div>
  )
}

export default CostTrendChart