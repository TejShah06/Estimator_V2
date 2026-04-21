import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts"

const COLORS = [
  "#06b6d4",    // cyan
  "#22c55e",    // green
  "#f59e0b",    // amber
  "#ef4444",    // red
  "#8b5cf6",    // purple
  "#14b8a6"     // teal
]

export default function MaterialCostPieChart({ costData }) {
  try {
    // Handle missing or invalid data
    if (!costData) {
      console.log("No costData provided")
      return null
    }

    console.log("costData type:", typeof costData)
    console.log("costData:", costData)

    let data = []

    // Handle array format
    if (Array.isArray(costData)) {
      data = costData
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          name: item.name || item.material_type || 'Unknown',
          value: Number(item.value || item.total_cost || 0)
        }))
        .filter(item => item.value > 0)
    } else if (typeof costData === 'object') {
      // Handle object format - shouldn't happen here but just in case
      return null
    }

    // Safety check
    if (!data || data.length === 0) {
      console.log("No valid cost data after processing")
      return null
    }

    const totalValue = data.reduce((sum, item) => {
      const val = Number(item.value) || 0
      return sum + val
    }, 0)

    if (totalValue === 0) {
      console.log("Total value is 0")
      return null
    }

    return (
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-cyan-400">
          Material Cost Distribution
        </h2>

        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const num = Number(value)
                return isNaN(num) ? '₹0' : `₹${num.toLocaleString()}`
              }}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* COST BREAKDOWN TABLE */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.map((item, index) => {
            const value = Number(item.value) || 0
            const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0'

            return (
              <div key={index} className="bg-slate-950 p-3 rounded border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <p className="text-xs text-gray-300">{item.name}</p>
                </div>
                <p className="font-bold text-sm text-white">
                  ₹{value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{percentage}%</p>
              </div>
            )
          })}
        </div>

        {/* TOTAL */}
        <div className="mt-6 pt-4 border-t border-cyan-500 flex justify-between items-center">
          <p className="text-lg font-semibold text-white">Total Material Cost</p>
          <p className="text-2xl font-bold text-green-400">
            ₹{totalValue.toLocaleString()}
          </p>
        </div>
      </div>
    )

  } catch (error) {
    console.error("Error in MaterialCostPieChart:", error)
    console.error("costData was:", costData)
    return (
      <div className="bg-slate-900 p-6 rounded-xl border border-red-800">
        <p className="text-red-400">Error rendering cost chart</p>
        <p className="text-red-300 text-sm mt-2">Check browser console for details</p>
      </div>
    )
  }
}