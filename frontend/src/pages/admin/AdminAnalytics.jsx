
import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { BarChart2 } from "lucide-react"
import { getMonthlyAnalytics } from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await getMonthlyAnalytics()
      setData(res.data)
    } catch (err) {
      console.error("Error:", err)
    }
    setLoading(false)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">AI vs Manual monthly trend</p>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm">Total AI Projects</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">{data.total_ai}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm">Total Manual Estimations</p>
              <p className="text-3xl font-bold text-teal-400 mt-1">{data.total_manual}</p>
            </div>
          </div>
        )}

        {/* Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">Monthly Project Trend</h2>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">Loading chart...</p>
            </div>
          ) : data?.chart_data?.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No data available yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data?.chart_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
                <Legend />
                <Bar dataKey="ai" name="AI Projects" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="manual" name="Manual Estimations" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}