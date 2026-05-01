// src/pages/admin/AdminProjects.jsx
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  FolderOpen,
  Brain,
  Calculator,
  Trash2,
  AlertCircle,
  Search,
} from "lucide-react"
import { getAllProjects, deleteProject } from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

const formatCost = (cost) => {
  if (!cost) return "₹0"
  const num = parseFloat(cost)
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`
  return `₹${num.toLocaleString("en-IN")}`
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState("")
  const [deleteModal, setDeleteModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [sourceFilter])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await getAllProjects({
        source_type: sourceFilter || undefined,
      })
      setProjects(res.data.projects)
      setTotal(res.data.total)
    } catch (err) {
      console.error("Error:", err)
    }
    setLoading(false)
  }

  const handleDelete = async (projectId) => {
    setActionLoading(projectId)
    try {
      await deleteProject(projectId)
      setDeleteModal(null)
      fetchProjects()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete")
    }
    setActionLoading(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Project Management</h1>
          <p className="text-gray-400 mt-1">Total: {total} projects</p>
        </div>

        {/* Filter */}
        <div className="flex gap-4">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Types</option>
            <option value="ai">AI Projects</option>
            <option value="manual">Manual Estimations</option>
          </select>
        </div>

        {/* Projects Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-4 px-6 text-gray-400 text-sm">Project</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm hidden md:table-cell">User</th>
                <th className="text-right py-4 px-6 text-gray-400 text-sm hidden lg:table-cell">Cost</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm">Type</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-4 px-6">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No projects found
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <p className="text-white font-medium text-sm">{project.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(project.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <p className="text-gray-300 text-sm">{project.user?.username}</p>
                      <p className="text-gray-500 text-xs">{project.user?.email}</p>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell text-right">
                      <p className="text-cyan-400 font-semibold text-sm">
                        {formatCost(project.cost)}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        project.source_type === "ai"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-teal-500/10 text-teal-400"
                      }`}>
                        {project.source_type === "ai" ? "🤖 AI" : "📋 Manual"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setDeleteModal(project)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Modal */}
        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteModal(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">Delete Project?</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Delete <span className="text-white font-medium">"{deleteModal.name}"</span>?
                    This cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setDeleteModal(null)}
                      className="px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteModal.id)}
                      disabled={actionLoading === deleteModal.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                    >
                      {actionLoading === deleteModal.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}