
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  Brain,
  Calculator,
  DollarSign,
  UserCheck,
  UserX,
  TrendingUp,
  FolderOpen,
} from "lucide-react"
import { getAdminStats } from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colors = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`bg-slate-900 border rounded-xl p-6 ${colors[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await getAdminStats()
      setStats(res.data)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
    setLoading(false)
  }

  const formatCost = (cost) => {
    if (!cost) return "₹0"
    const num = parseFloat(cost)
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`
    return `₹${num.toLocaleString("en-IN")}`
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">System overview and statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.users?.total || 0}
            subtitle="Registered engineers"
            icon={Users}
            color="cyan"
          />
          <StatCard
            title="Active Users"
            value={stats?.users?.active || 0}
            subtitle="Currently active"
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Inactive Users"
            value={stats?.users?.inactive || 0}
            subtitle="Deactivated accounts"
            icon={UserX}
            color="red"
          />
          <StatCard
            title="AI Projects"
            value={stats?.projects?.total_ai || 0}
            subtitle="Floor plan analyses"
            icon={Brain}
            color="purple"
          />
          <StatCard
            title="Manual Estimations"
            value={stats?.projects?.total_manual || 0}
            subtitle="Calculator estimates"
            icon={Calculator}
            color="amber"
          />
          <StatCard
            title="Total Cost Generated"
            value={formatCost(stats?.costs?.grand_total)}
            subtitle="Across all projects"
            icon={DollarSign}
            color="blue"
          />
        </div>

        {/* Latest Users & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Latest Users */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Latest Users</h2>
            </div>
            <div className="space-y-3">
              {stats?.latest_users?.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-400 text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user.username}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.is_active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Latest Projects */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Latest Projects</h2>
            </div>
            <div className="space-y-3">
              {stats?.latest_projects?.slice(0, 5).map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      project.type === "ai"
                        ? "bg-purple-500/10"
                        : "bg-teal-500/10"
                    }`}>
                      {project.type === "ai"
                        ? <Brain className="w-4 h-4 text-purple-400" />
                        : <Calculator className="w-4 h-4 text-teal-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{project.name}</p>
                      <p className="text-gray-400 text-xs capitalize">{project.type}</p>
                    </div>
                  </div>
                  <p className="text-cyan-400 font-semibold text-sm">
                    {formatCost(project.cost)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}