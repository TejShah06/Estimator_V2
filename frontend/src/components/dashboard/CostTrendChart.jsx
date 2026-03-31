import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts"
import { TrendingUp, BarChart3 } from "lucide-react"
import { useState } from "react"

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ₹{(entry.value / 100000).toFixed(1)}L
          </p>
        ))}
      </div>
    )
  }
  return null
}

const CostTrendChart = ({ projects }) => {
  const [chartType, setChartType] = useState("area") // "area" or "bar"

  // Transform projects data for chart
  const chartData = projects.slice(0, 10).reverse().map((p, i) => ({
    name: p.project_name || `Project ${i + 1}`,
    cost: parseFloat(p.estimated_cost) || 0,
    area: parseFloat(p.total_area) || 0,
    rooms: parseInt(p.rooms_count) || 0,
  }))

  // If no data, show sample data
  const sampleData = [
    { name: "Plan 1", cost: 850000, area: 1200, rooms: 4 },
    { name: "Plan 2", cost: 1250000, area: 1850, rooms: 6 },
    { name: "Plan 3", cost: 780000, area: 950, rooms: 3 },
    { name: "Plan 4", cost: 1580000, area: 2100, rooms: 7 },
    { name: "Plan 5", cost: 920000, area: 1100, rooms: 5 },
    { name: "Plan 6", cost: 1100000, area: 1500, rooms: 5 },
  ]

  const data = chartData.length > 0 ? chartData : sampleData
  const isDemo = chartData.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-xl border border-gray-100 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Cost Trend
          </h2>
          {isDemo && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Sample Data
            </span>
          )}
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setChartType("area")}
            className={`p-1.5 rounded-md transition-all ${
              chartType === "area"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`p-1.5 rounded-md transition-all ${
              chartType === "bar"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cost"
                name="Estimated Cost"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="cost"
                name="Cost (₹)"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-400">Avg Cost</p>
            <p className="text-sm font-semibold text-gray-900">
              ₹{(data.reduce((a, b) => a + b.cost, 0) / data.length / 100000).toFixed(1)}L
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-xs text-gray-400">Highest</p>
            <p className="text-sm font-semibold text-gray-900">
              ₹{(Math.max(...data.map(d => d.cost)) / 100000).toFixed(1)}L
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-xs text-gray-400">Lowest</p>
            <p className="text-sm font-semibold text-gray-900">
              ₹{(Math.min(...data.map(d => d.cost)) / 100000).toFixed(1)}L
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+12.5%</span>
        </div>
      </div>
    </motion.div>
  )
}

export default CostTrendChart