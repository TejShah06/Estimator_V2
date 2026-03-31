import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Brain,
  Calculator,
  Clock,
  MoreVertical,
  Eye,
  Trash2,
  TrendingUp
} from "lucide-react"
import { useState } from "react"

const statusColors = {
  completed: "bg-green-100 text-green-700",
  processing: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700"
}

const ProjectRow = ({ project, index }) => {
  const [showMenu, setShowMenu] = useState(false)

  const timeAgo = (date) => {
    if (!date) return ""
    const now = new Date()
    const then = new Date(date)
    const diff = Math.floor((now - then) / 1000)

    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return then.toLocaleDateString("en-IN")
  }

  const formatCost = (cost) => {
    if (!cost) return "₹0"
    const num = parseFloat(cost)
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`
    return `₹${num}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ backgroundColor: "#F8FAFC" }}
      className="flex items-center justify-between p-3 rounded-lg
                 border border-transparent hover:border-gray-100
                 transition-all cursor-pointer group relative"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`p-2 rounded-lg ${
            project.source_type === "ai"
              ? "bg-purple-100"
              : "bg-teal-100"
          }`}
        >
          {project.source_type === "ai" ? (
            <Brain className="w-4 h-4 text-purple-600" />
          ) : (
            <Calculator className="w-4 h-4 text-teal-600" />
          )}
        </motion.div>

        {/* Details */}
        <div>
          <p className="font-medium text-gray-900 text-sm">
            {project.project_name || `Project ${index + 1}`}
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {timeAgo(project.created_at)}
            </span>

            {project.rooms_count && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-400">
                  {project.rooms_count} rooms
                </span>
              </>
            )}

            {project.total_area && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-400">
                  {project.total_area} sqft
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cost + Actions */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-bold text-gray-900 text-sm">
            {formatCost(project.estimated_cost)}
          </p>

          <span className={`text-xs px-2 py-0.5 rounded-full ${
            statusColors[project.status] || statusColors.completed
          }`}>
            {project.status || "completed"}
          </span>
        </div>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100
                       transition-opacity hover:bg-gray-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                className="absolute right-0 top-8 bg-white rounded-lg shadow-lg
                           border border-gray-100 py-1 z-10 w-32"
              >
                <button className="flex items-center gap-2 px-3 py-2 text-sm
                                   text-gray-700 hover:bg-gray-50 w-full">
                  <Eye className="w-3 h-3" /> View
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm
                                   text-red-600 hover:bg-red-50 w-full">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

const RecentProjects = ({ projects, loading, onViewAll }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-100 p-6 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Projects
          </h2>
        </div>

        <motion.button
          whileHover={{ x: 4 }}
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-blue-600
                     hover:text-blue-700 font-medium"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Project List */}
      <div className="space-y-1">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))
        ) : projects.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FolderOpen className="w-12 h-12 text-gray-300" />
            </motion.div>
            <p className="text-gray-400 mt-3 text-sm">
              No projects yet
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Upload a floor plan to get started
            </p>
          </motion.div>
        ) : (
          // Project rows
          projects.slice(0, 6).map((project, index) => (
            <ProjectRow
              key={project.id || index}
              project={project}
              index={index}
            />
          ))
        )}
      </div>
    </motion.div>
  )
}

// Need to import FolderOpen for empty state
import { FolderOpen } from "lucide-react"

export default RecentProjects