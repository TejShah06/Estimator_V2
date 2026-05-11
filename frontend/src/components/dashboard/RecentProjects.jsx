import { useState, useMemo }        from "react"
import { useNavigate }              from "react-router-dom"
import { motion, AnimatePresence }  from "framer-motion"
import {
  ArrowRight, Brain, Calculator, Clock,
  MoreVertical, Eye, Trash2, TrendingUp,
  FolderOpen, Filter, Check, AlertCircle,
} from "lucide-react"
import axios    from "axios"
import { getToken } from "@/utils/auth"

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  if (!date) return ""
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)     return "Just now"
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString("en-IN")
}

const formatCost = (cost) => {
  if (!cost) return "₹0"
  const num = parseFloat(cost)
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
  if (num >= 100000)   return `₹${(num / 100000).toFixed(1)} L`
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)} K`
  return `₹${num.toLocaleString("en-IN")}`
}

// ── Filter Dropdown ───────────────────────────────────────────────────────────
const FilterDropdown = ({ filter, setFilter }) => {
  const [open, setOpen] = useState(false)

  const options = [
    { value: "all",    label: "All Projects",      icon: null       },
    { value: "ai",     label: "AI Analysis",        icon: Brain      },
    { value: "manual", label: "Manual Estimates",   icon: Calculator },
  ]

  const current = options.find(o => o.value === filter)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5
                   border border-white/10 hover:bg-white/10 transition-colors text-sm"
      >
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-300">{current?.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -5, scale: 0.95 }}
              className="absolute right-0 top-10 bg-slate-900/95 backdrop-blur-xl
                         rounded-xl shadow-2xl border border-white/10 py-1.5 z-20 w-44"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setFilter(option.value); setOpen(false) }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left
                               hover:bg-white/5 transition-colors ${
                    filter === option.value ? "bg-white/5" : ""
                  }`}
                >
                  {option.icon
                    ? <option.icon className={`w-4 h-4 ${
                        option.value === "ai" ? "text-purple-400" : "text-teal-400"
                      }`} />
                    : <div className="w-4" />
                  }
                  <span className="flex-1 text-gray-300">{option.label}</span>
                  {filter === option.value && (
                    <Check className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, projectName, isDeleting }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-gradient-to-br from-slate-900 to-slate-800
                     border border-white/10 rounded-2xl p-6
                     max-w-md w-full mx-4 shadow-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Delete Project?
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                Are you sure you want to delete{" "}
                <span className="font-medium text-white">"{projectName}"</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm border border-white/10 text-gray-300
                             rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30
                             border border-red-400/30 text-red-300 rounded-xl
                             transition-colors disabled:opacity-50
                             flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── Project Row ───────────────────────────────────────────────────────────────
const ProjectRow = ({ project, index, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false)
  const isAI = project.source_type === "ai"

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0  }}
      exit={{    opacity: 0, x: 20  }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onView?.(project)}
      className="flex items-center justify-between p-3 rounded-xl border
                 border-transparent hover:border-white/10 hover:bg-white/5
                 transition-all cursor-pointer group relative"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`p-2 rounded-xl ${
            isAI
              ? "bg-purple-500/10 border border-purple-400/20"
              : "bg-teal-500/10   border border-teal-400/20"
          }`}
        >
          {isAI
            ? <Brain      className="w-4 h-4 text-purple-400" />
            : <Calculator className="w-4 h-4 text-teal-400"   />
          }
        </motion.div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white text-sm">{project.project_name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              isAI
                ? "bg-purple-500/10 text-purple-300 border border-purple-400/20"
                : "bg-teal-500/10   text-teal-300   border border-teal-400/20"
            }`}>
              {isAI ? "AI" : "Manual"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <Clock className="w-3 h-3 text-gray-600" />
            <span className="text-xs text-gray-500">{timeAgo(project.created_at)}</span>

            {project.rooms_count > 0 && (
              <><span className="text-gray-700">•</span>
              <span className="text-xs text-gray-500">{project.rooms_count} rooms</span></>
            )}
            {project.total_area > 0 && (
              <><span className="text-gray-700">•</span>
              <span className="text-xs text-gray-500">{Math.round(project.total_area)} sqft</span></>
            )}
            {project.doors_count > 0 && (
              <><span className="text-gray-700">•</span>
              <span className="text-xs text-gray-500">{project.doors_count} doors</span></>
            )}
            {project.floors > 1 && (
              <><span className="text-gray-700">•</span>
              <span className="text-xs text-gray-500">{project.floors} floors</span></>
            )}
          </div>
        </div>
      </div>

      {/* Cost + Actions */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-bold text-white text-sm">
            {formatCost(project.estimated_cost)}
          </p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            project.status === "failed"
              ? "bg-red-500/10    text-red-400"
              : project.status === "processing"
              ? "bg-amber-500/10  text-amber-400"
              : "bg-green-500/10  text-green-400"
          }`}>
            {project.status || "completed"}
          </span>
        </div>

        {/* Context menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                       transition-opacity hover:bg-white/10"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1,   y: 0  }}
                  exit={{    opacity: 0, scale: 0.9, y: -5 }}
                  className="absolute right-0 top-8 bg-slate-900/95 backdrop-blur-xl
                             rounded-xl shadow-2xl border border-white/10
                             py-1.5 z-20 w-36"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onView?.(project); setShowMenu(false) }}
                    className="flex items-center gap-2 px-3 py-2 text-sm
                               text-gray-300 hover:bg-white/5 w-full text-left transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    View Details
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(project); setShowMenu(false) }}
                    className="flex items-center gap-2 px-3 py-2 text-sm
                               text-red-400 hover:bg-red-500/10 w-full text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const RecentProjects = ({ projects, loading, onViewAll, onProjectsChange }) => {
  const navigate = useNavigate()
  const [filter,      setFilter]      = useState("all")
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null })
  const [isDeleting,  setIsDeleting]  = useState(false)

  const filteredProjects = useMemo(() => {
    if (filter === "all") return projects
    return projects.filter(p => p.source_type === filter)
  }, [projects, filter])

  const aiCount     = projects.filter(p => p.source_type === "ai").length
  const manualCount = projects.filter(p => p.source_type === "manual").length

  const handleView = (project) => {
    const realId = project.id.split("-")[1]
    if (project.source_type === "ai") {
      navigate(`/report/${realId}`)
    } else {
      navigate(`/estimation-report/${realId}`)
    }
  }

  const handleDeleteClick   = (project) => setDeleteModal({ isOpen: true, project })

  const handleDeleteConfirm = async () => {
    if (!deleteModal.project) return
    setIsDeleting(true)
    try {
      const token = getToken()
      await axios.delete(`http://localhost:8000/projects/${deleteModal.project.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeleteModal({ isOpen: false, project: null })
      onProjectsChange?.()
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to delete project")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl
                   border border-white/10 rounded-2xl p-6 h-full shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20
                            border border-cyan-400/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">Recent Projects</h2>
              {!loading && projects.length > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-purple-500/10 text-purple-300
                                   border border-purple-400/20 px-1.5 py-0.5 rounded-full">
                    {aiCount} AI
                  </span>
                  <span className="text-[10px] bg-teal-500/10 text-teal-300
                                   border border-teal-400/20 px-1.5 py-0.5 rounded-full">
                    {manualCount} Manual
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!loading && projects.length > 0 && (
              <FilterDropdown filter={filter} setFilter={setFilter} />
            )}
            <motion.button
              whileHover={{ x: 3 }}
              onClick={onViewAll}
              className="flex items-center gap-1 text-sm text-cyan-400
                         hover:text-cyan-300 font-medium transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Active filter */}
        {filter !== "all" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-3 flex items-center gap-2 text-xs text-gray-500"
          >
            <span>Showing:</span>
            <span className={`px-2 py-0.5 rounded-full font-medium border ${
              filter === "ai"
                ? "bg-purple-500/10 text-purple-300 border-purple-400/20"
                : "bg-teal-500/10   text-teal-300   border-teal-400/20"
            }`}>
              {filter === "ai" ? "AI Analysis" : "Manual Estimates"}
            </span>
            <button onClick={() => setFilter("all")} className="text-cyan-400 hover:underline">
              Clear
            </button>
          </motion.div>
        )}

        {/* List */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1
                        scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 bg-white/5 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
              </div>
            ))
          ) : filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-12"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FolderOpen className="w-12 h-12 text-gray-700" />
              </motion.div>
              <p className="text-gray-400 mt-3 text-sm">
                {filter === "all" ? "No projects yet" : `No ${filter === "ai" ? "AI" : "manual"} projects yet`}
              </p>
              <p className="text-gray-600 text-xs mt-1 text-center max-w-xs">
                {filter === "all"
                  ? "Upload a floor plan or use the calculator to get started"
                  : filter === "ai"
                  ? "Upload a floor plan to create an AI analysis"
                  : "Use the calculator to create a manual estimate"}
              </p>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-3 text-sm text-cyan-400 hover:underline"
                >
                  Show all projects
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  index={index}
                  onDelete={handleDeleteClick}
                  onView={handleView}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer stats */}
        {!loading && filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-3 border-t border-white/5 flex items-center
                       justify-between text-xs text-gray-500"
          >
            <span>Showing {filteredProjects.length} of {projects.length} projects</span>
            <span className="text-gray-400 font-medium">
              Total: {formatCost(
                filteredProjects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0)
              )}
            </span>
          </motion.div>
        )}
      </motion.div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, project: null })}
        onConfirm={handleDeleteConfirm}
        projectName={deleteModal.project?.project_name}
        isDeleting={isDeleting}
      />
    </>
  )
}

export default RecentProjects