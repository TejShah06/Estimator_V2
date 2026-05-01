// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Users,
  Search,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react"
import {
  getAllUsers,
  toggleUserStatus,
  deleteUser,
} from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [actionLoading, setActionLoading] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [search, statusFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await getAllUsers({
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setUsers(res.data.users)
      setTotal(res.data.total)
    } catch (err) {
      console.error("Error fetching users:", err)
    }
    setLoading(false)
  }

  const handleToggleStatus = async (userId) => {
    setActionLoading(userId)
    try {
      await toggleUserStatus(userId)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to toggle status")
    }
    setActionLoading(null)
  }

  const handleDelete = async (userId) => {
    setActionLoading(userId)
    try {
      await deleteUser(userId)
      setDeleteModal(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user")
    }
    setActionLoading(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-1">Total: {total} users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-semibold">User</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-semibold hidden md:table-cell">Email</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm font-semibold hidden lg:table-cell">Projects</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm font-semibold">Status</th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="py-4 px-6">
                      <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="h-4 w-16 bg-slate-800 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 w-20 bg-slate-800 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-8 w-24 bg-slate-800 rounded animate-pulse mx-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-cyan-500/20 rounded-full flex items-center justify-center">
                          <span className="text-cyan-400 font-bold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{user.username}</p>
                          <p className="text-gray-400 text-xs">{user.full_name || "No name"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <p className="text-gray-300 text-sm">{user.email}</p>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full">
                          {user.ai_projects} AI
                        </span>
                        <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-1 rounded-full">
                          {user.manual_estimations} Manual
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        user.is_active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          disabled={actionLoading === user.id}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_active
                              ? "hover:bg-amber-500/10 text-amber-400"
                              : "hover:bg-green-500/10 text-green-400"
                          }`}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active
                            ? <UserX className="w-4 h-4" />
                            : <UserCheck className="w-4 h-4" />
                          }
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteModal(user)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                  <h3 className="text-white font-semibold text-lg mb-2">Delete User?</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Are you sure you want to delete{" "}
                    <span className="text-white font-medium">"{deleteModal.username}"</span>?
                    This action cannot be undone.
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
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
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