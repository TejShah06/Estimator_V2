import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom" // ✅ Add this import
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Brain,
  Calculator,
  Clock,
  MoreVertical,
  Eye,
  Trash2,
  TrendingUp,
  FolderOpen,
  Filter,
  Check,
  AlertCircle
} from "lucide-react"
import axios from "axios" // ✅ Add this import

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
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`
  return `₹${num.toLocaleString("en-IN")}`
}

// Filter Dropdown Component
const FilterDropdown = ({ filter, setFilter }) => {
  const [open, setOpen] = useState(false)

  const options = [
    { value: "all", label: "All Projects", icon: null },
    { value: "ai", label: "AI Analysis", icon: Brain },
    { value: "manual", label: "Manual Estimates", icon: Calculator },
  ]

  const currentOption = options.find(o => o.value === filter)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border
                   hover:bg-accent transition-colors text-sm"
      >
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-foreground">{currentOption?.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="absolute right-0 top-10 bg-popover rounded-lg shadow-lg
                         border border-border py-1 z-20 w-44"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilter(option.value)
                    setOpen(false)
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left
                             hover:bg-accent transition-colors
                             ${filter === option.value ? "bg-accent/50" : ""}`}
                >
                  {option.icon && (
                    <option.icon className={`w-4 h-4 ${
                      option.value === "ai" ? "text-purple-600" : "text-teal-600"
                    }`} />
                  )}
                  {!option.icon && <div className="w-4" />}
                  <span className="flex-1">{option.label}</span>
                  {filter === option.value && (
                    <Check className="w-4 h-4 text-primary" />
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

//  Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, projectName, isDeleting }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card rounded-xl border border-border p-6 max-w-md w-full mx-4 shadow-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete Project?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete <span className="font-medium text-foreground">"{projectName}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
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

// Project Row Component
const ProjectRow = ({ project, index, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false)
  const isAI = project.source_type === "ai"

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onView?.(project)}
      className="flex items-center justify-between p-3 rounded-lg
                 border border-transparent hover:border-border
                 hover:bg-accent/50 transition-all cursor-pointer group relative"
    >
      <div className="flex items-center gap-3">
        {/* Source icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`p-2 rounded-lg ${
            isAI ? "bg-purple-500/10" : "bg-teal-500/10"
          }`}
        >
          {isAI ? (
            <Brain className="w-4 h-4 text-purple-600" />
          ) : (
            <Calculator className="w-4 h-4 text-teal-600" />
          )}
        </motion.div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground text-sm">
              {project.project_name}
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              isAI
                ? "bg-purple-500/10 text-purple-700"
                : "bg-teal-500/10 text-teal-700"
            }`}>
              {isAI ? "AI" : "Manual"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {timeAgo(project.created_at)}
            </span>

            {project.rooms_count > 0 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground">
                  {project.rooms_count} rooms
                </span>
              </>
            )}

            {project.total_area > 0 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(project.total_area)} sqft
                </span>
              </>
            )}

            {project.doors_count > 0 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground">
                  {project.doors_count} doors
                </span>
              </>
            )}

            {project.floors > 1 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground">
                  {project.floors} floors
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cost + Actions */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-bold text-foreground text-sm">
            {formatCost(project.estimated_cost)}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            project.status === "failed"
              ? "bg-destructive/10 text-destructive"
              : project.status === "processing"
              ? "bg-amber-500/10 text-amber-700"
              : "bg-green-500/10 text-green-700"
          }`}>
            {project.status || "completed"}
          </span>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100
                       transition-opacity hover:bg-accent"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  className="absolute right-0 top-8 bg-popover rounded-lg shadow-lg
                             border border-border py-1 z-20 w-32"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onView?.(project)
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm
                               text-foreground hover:bg-accent w-full text-left"
                  >
                    <Eye className="w-3 h-3" /> View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.(project)
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm
                               text-destructive hover:bg-destructive/10 w-full text-left"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
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

//  Main Component
const RecentProjects = ({ projects, loading, onViewAll, onProjectsChange }) => {
  const navigate = useNavigate() // ✅ Add navigate hook
  const [filter, setFilter] = useState("all")
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null })
  const [isDeleting, setIsDeleting] = useState(false)

  //  Filter projects based on selection
  const filteredProjects = useMemo(() => {
    if (filter === "all") return projects
    return projects.filter(p => p.source_type === filter)
  }, [projects, filter])

  //  Count by type
  const aiCount = projects.filter(p => p.source_type === "ai").length
  const manualCount = projects.filter(p => p.source_type === "manual").length

  //  Handle View Project
  const handleView = (project) => {
    if (project.source_type === "ai") {
      // Extract the real ID from "ai-123" format
      const realId = project.id.split("-")[1]
      navigate(`/report/${realId}`)
    } else {
      // For manual projects, navigate to calculator or a manual estimate view
      const Id = project.id.split("-")[1]
      navigate(`/estimation-report/${Id}`) // You can create this route or redirect as needed
    }
  }

  // Handle Delete Project
  const handleDeleteClick = (project) => {
    setDeleteModal({ isOpen: true, project })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.project) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      
      await axios.delete(
        `http://localhost:8000/projects/${deleteModal.project.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Close modal
      setDeleteModal({ isOpen: false, project: null })

      // Refresh projects list
      if (onProjectsChange) {
        onProjectsChange()
      }

      // Show success message (optional - you can use a toast library)
      console.log("Project deleted successfully")

    } catch (error) {
      console.error(" Error deleting project:", error)
      alert(error.response?.data?.detail || "Failed to delete project")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-6 h-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Recent Projects
            </h2>

            {/* Summary badges */}
            {!loading && projects.length > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-[10px] bg-purple-500/10 text-purple-700 px-1.5 py-0.5 rounded-full">
                  {aiCount} AI
                </span>
                <span className="text-[10px] bg-teal-500/10 text-teal-700 px-1.5 py-0.5 rounded-full">
                  {manualCount} Manual
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            {!loading && projects.length > 0 && (
              <FilterDropdown filter={filter} setFilter={setFilter} />
            )}

            <motion.button
              whileHover={{ x: 4 }}
              onClick={onViewAll}
              className="flex items-center gap-1 text-sm text-primary
                         hover:text-primary/80 font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Active Filter Indicator */}
        {filter !== "all" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Showing:</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                filter === "ai"
                  ? "bg-purple-500/10 text-purple-700"
                  : "bg-teal-500/10 text-teal-700"
              }`}>
                {filter === "ai" ? "AI Analysis" : "Manual Estimates"}
              </span>
              <button
                onClick={() => setFilter("all")}
                className="text-primary hover:underline"
              >
                Clear filter
              </button>
            </div>
          </motion.div>
        )}

        {/* List */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted/60 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
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
                <FolderOpen className="w-12 h-12 text-muted-foreground/30" />
              </motion.div>
              <p className="text-muted-foreground mt-3 text-sm">
                {filter === "all"
                  ? "No projects yet"
                  : `No ${filter === "ai" ? "AI" : "manual"} projects yet`}
              </p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                {filter === "all"
                  ? "Upload a floor plan or use the calculator to get started"
                  : filter === "ai"
                  ? "Upload a floor plan to create an AI analysis"
                  : "Use the calculator to create a manual estimate"}
              </p>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-3 text-sm text-primary hover:underline"
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
            className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground"
          >
            <span>
              Showing {filteredProjects.length} of {projects.length} projects
            </span>
            <span>
              Total: {formatCost(
                filteredProjects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0)
              )}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
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