// src/pages/AnalysisReport.jsx
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Download,
  Share2,
  Printer,
  FileSpreadsheet,
  Ruler,
  DoorOpen,
  FrameIcon,
  Home,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Layers,
  Maximize2
} from "lucide-react"
import api from "../services/api"
import MainLayout from "@/layout/MainLayout"

const formatCost = (cost) => {
  if (!cost) return "₹0"
  const num = parseFloat(cost)
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`
  return `₹${num.toLocaleString("en-IN")}`
}

const formatArea = (area) => {
  if (!area) return "0"
  return Math.round(area).toLocaleString("en-IN")
}

// ✅ Stats Card Component
const StatCard = ({ icon: Icon, label, value, subtext, color = "blue" }) => {
  const colorClasses = {
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  }

  const iconColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl border rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm ${iconColors[color]}`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
            <span className="text-xs sm:text-sm text-gray-300 font-medium">{label}</span>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
            {value}
          </p>
          {subtext && (
            <p className="text-[10px] sm:text-xs text-gray-400">{subtext}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ✅ Cost Breakdown Card
const CostBreakdownCard = ({ breakdown, total }) => {
  const items = [
    { key: "flooring", label: "Flooring", color: "from-blue-500 to-cyan-500" },
    { key: "painting", label: "Painting", color: "from-green-500 to-emerald-500" },
    { key: "ceiling", label: "Ceiling", color: "from-purple-500 to-pink-500" },
    { key: "electrical", label: "Electrical", color: "from-amber-500 to-orange-500" },
    { key: "plumbing", label: "Plumbing", color: "from-cyan-500 to-blue-500" },
    { key: "doors", label: "Doors & Windows", color: "from-pink-500 to-rose-500" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-lg"
    >
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
        Cost Breakdown
      </h3>

      <div className="space-y-3 sm:space-y-4">
        {items.map((item, index) => {
          const amount = breakdown[item.key] || 0
          const percentage = total > 0 ? (amount / total) * 100 : 0

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1.5 sm:space-y-2"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-300 font-medium">{item.label}</span>
                <span className="font-bold text-white">
                  {formatCost(amount)}
                </span>
              </div>
              <div className="h-2 sm:h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                  className={`h-full bg-gradient-to-r ${item.color} rounded-full shadow-lg`}
                />
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500">
                {percentage.toFixed(1)}% of total
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-semibold text-gray-300">Total Cost</span>
          <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {formatCost(total)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ✅ Room Details Table
const RoomDetailsTable = ({ rooms }) => {
  if (!rooms || rooms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8"
      >
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          Room Details
        </h3>
        <div className="text-center py-8 sm:py-12">
          <Home className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-400">No room details available</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-lg"
    >
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
        Room Details
      </h3>

      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">
                #
              </th>
              <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">
                Room Type
              </th>
              <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">
                Area (sqft)
              </th>
              <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">
                Dimensions
              </th>
              <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">
                Features
              </th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {room.type || room.label || "Room"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-white">
                  {formatArea(room.area_sqft)}
                </td>
                <td className="py-3 px-2 sm:px-4 text-right text-xs sm:text-sm text-gray-400">
                  {room.width_ft && room.length_ft
                    ? `${room.width_ft.toFixed(1)} × ${room.length_ft.toFixed(1)} ft`
                    : room.width && room.height
                    ? `${room.width.toFixed(1)} × ${room.height.toFixed(1)} ft`
                    : "—"
                  }
                </td>
                <td className="py-3 px-2 sm:px-4 text-center">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                    {room.doors > 0 && (
                      <span className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border border-blue-500/30">
                        {room.doors} door{room.doors > 1 ? "s" : ""}
                      </span>
                    )}
                    {room.windows > 0 && (
                      <span className="text-[10px] sm:text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border border-amber-500/30">
                        {room.windows} window{room.windows > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 flex items-center justify-between">
        <span className="text-sm sm:text-base text-gray-400">Total Rooms</span>
        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          {rooms.length}
        </span>
      </div>
    </motion.div>
  )
} 

// ✅ Annotated Floor Plan Preview
const AnnotatedFloorPlan = ({ previewPath, projectName, projectId }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getImageUrl = () => {
    if (!previewPath) return null
    
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
    
    if (previewPath.startsWith("http")) {
      return previewPath
    }
    
    if (previewPath.startsWith("/")) {
      return `${baseUrl}${previewPath}`
    }
    
    return `${baseUrl}/${previewPath}`
  }

  const imageUrl = getImageUrl()

  if (!imageUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8"
      >
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          Floor Plan Analysis
        </h3>
        <div className="aspect-video bg-slate-800/50 rounded-lg sm:rounded-xl flex items-center justify-center">
          <div className="text-center">
            <FrameIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-400">No preview available</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-lg"
    >
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
        Floor Plan Analysis
      </h3>

      <div className="relative rounded-lg sm:rounded-xl overflow-hidden border border-white/10 bg-slate-900/50">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-cyan-400 animate-spin" />
          </div>
        )}
        
        {imageError ? (
          <div className="aspect-video flex items-center justify-center">
            <div className="text-center p-4">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-400">Failed to load image</p>
              <p className="text-xs text-gray-600 mt-2 break-all">{imageUrl}</p>
            </div>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={projectName}
            onLoad={() => {
              console.log("✅ Image loaded successfully:", imageUrl)
              setImageLoaded(true)
            }}
            onError={(e) => {
              console.error("❌ Image failed to load:", imageUrl)
              setImageError(true)
            }}
            className={`w-full h-auto transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500/30 border-2 border-green-500" />
          <span className="text-gray-300">Rooms</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500/30 border-2 border-blue-500" />
          <span className="text-gray-300">Doors</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-500/30 border-2 border-yellow-500" />
          <span className="text-gray-300">Windows</span>
        </div>
      </div>
    </motion.div>
  )
}

// ✅ Main Report Page
const AnalysisReport = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [projectId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const realId = projectId.startsWith("ai-")
        ? projectId.split("-")[1]
        : projectId

      console.log("📊 Fetching report for ID:", realId)

      const response = await api.get(`/floorplan/report/${realId}`)
      
      console.log("📊 Report data received:", response.data)
      
      setReport(response.data)
    } catch (err) {
      console.error("❌ Error fetching report:", err)
      setError(err.response?.data?.detail || "Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    alert("PDF download feature coming soon!")
  }

  const handleExportExcel = () => {
    alert("Excel export feature coming soon!")
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: report.project_name,
        text: `Floor Plan Analysis Report - ${formatCost(report.total_cost)}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleSaveProject = async () => {
    try {
      setSaving(true)
      alert("Project is already saved!")
    } catch (err) {
      console.error("Error saving:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4 sm:mb-6"
            >
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400" />
            </motion.div>
            <p className="text-base sm:text-lg text-gray-300">Loading report...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-red-500/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full text-center"
          >
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
              Failed to Load Report
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg sm:rounded-xl transition-all font-medium"
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative">
        {/* Animated Background */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10 pointer-events-none" />
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        {/* ✅ FIXED HEADER - No hover animations on buttons */}
        <div className="sticky top-0 sm:top-16 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* Left: Back + Title */}
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="p-2 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                    {report.project_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400">
                      {new Date(report.created_at).toLocaleString("en-IN")}
                    </span>
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
                      report.status === "completed"
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ✅ Right: Action Buttons - Removed whileHover and whileTap */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <button
                  onClick={handlePrint}
                  className="px-3 py-2 sm:px-4 border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap flex-shrink-0"
                >
                  <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="px-3 py-2 sm:px-4 border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap flex-shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-3 py-2 sm:px-4 border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap flex-shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-2 sm:px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg sm:rounded-xl transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-white whitespace-nowrap shadow-lg shadow-cyan-500/25 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
            <StatCard
              icon={Ruler}
              label="Total Area"
              value={formatArea(report.total_area_sqft)}
              subtext={`${formatArea(report.total_area_m2)} m²`}
              color="blue"
            />
            <StatCard
              icon={Home}
              label="Rooms"
              value={report.rooms_count}
              subtext="Detected spaces"
              color="green"
            />
            <StatCard
              icon={DoorOpen}
              label="Openings"
              value={report.doors_count + report.windows_count}
              subtext={`${report.doors_count} doors, ${report.windows_count} windows`}
              color="purple"
            />
            <StatCard
              icon={TrendingUp}
              label="Estimated Cost"
              value={formatCost(report.total_cost)}
              subtext="Total project cost"
              color="amber"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Floor Plan & Rooms */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <AnnotatedFloorPlan
                previewPath={report.preview_path}
                projectName={report.project_name}
                projectId={projectId}
              />
              <RoomDetailsTable rooms={report.rooms} />
            </div>

            {/* Right Column - Cost & Info */}
            <div className="space-y-6 sm:space-y-8">
              <CostBreakdownCard
                breakdown={report.cost_breakdown}
                total={report.total_cost}
              />

              {/* Analysis Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-lg"
              >
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                  Analysis Info
                </h3>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl">
                    <span className="text-gray-400">Scale Method</span>
                    <span className="font-semibold text-white capitalize">
                      {report.scale_method}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl">
                    <span className="text-gray-400">Processing Time</span>
                    <span className="font-semibold text-white">
                      {report.analysis_time?.toFixed(1) || 0}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl">
                    <span className="text-gray-400">Scale Factor</span>
                    <span className="font-semibold text-white">
                      {report.scale_px_per_foot?.toFixed(2) || 0} px/ft
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Save Project Button */}
              <button
                onClick={handleSaveProject}
                disabled={saving}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl sm:rounded-2xl transition-all font-medium flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 shadow-lg shadow-green-500/25"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm sm:text-base">Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm sm:text-base">Project Saved</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default AnalysisReport