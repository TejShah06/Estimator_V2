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

// ✅ NEW: SVG Floor Plan Generator Component
const SVGFloorPlanGenerator = ({ rooms, projectName }) => {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="aspect-video bg-slate-800/50 rounded-lg sm:rounded-xl flex items-center justify-center">
        <div className="text-center">
          <FrameIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-400">No room data available</p>
        </div>
      </div>
    )
  }

  // Calculate SVG dimensions based on total area
  const PADDING = 40
  const ROOM_SPACING = 10
  
  // Calculate grid layout
  const cols = Math.ceil(Math.sqrt(rooms.length))
  const rows = Math.ceil(rooms.length / cols)
  
  // Find max area for scaling
  const maxArea = Math.max(...rooms.map(r => r.area_sqft || 0))
  const baseRoomSize = 120 // Base size in pixels
  
  // Generate room positions and dimensions
  const roomElements = rooms.map((room, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    
    // Calculate room dimensions proportional to area
    const areaRatio = Math.sqrt((room.area_sqft || 0) / maxArea)
    const roomWidth = baseRoomSize * Math.max(areaRatio, 0.5)
    const roomHeight = baseRoomSize * Math.max(areaRatio, 0.5)
    
    const x = PADDING + col * (baseRoomSize + ROOM_SPACING)
    const y = PADDING + row * (baseRoomSize + ROOM_SPACING)
    
    return {
      ...room,
      x,
      y,
      width: roomWidth,
      height: roomHeight,
      index: index + 1
    }
  })

  const svgWidth = cols * (baseRoomSize + ROOM_SPACING) + PADDING * 2
  const svgHeight = rows * (baseRoomSize + ROOM_SPACING) + PADDING * 2

  // Color configurations for different room types
  const getGradientColors = (index) => {
    const gradients = [
      { start: '#3b82f6', end: '#06b6d4' }, // blue-cyan
      { start: '#10b981', end: '#059669' }, // green-emerald
      { start: '#a855f7', end: '#ec4899' }, // purple-pink
      { start: '#f59e0b', end: '#f97316' }, // amber-orange
      { start: '#06b6d4', end: '#3b82f6' }, // cyan-blue
      { start: '#ec4899', end: '#f43f5e' }, // pink-rose
    ]
    return gradients[index % gradients.length]
  }

  return (
    <div className="w-full bg-slate-900/50 rounded-lg sm:rounded-xl overflow-hidden border border-white/10">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ minHeight: '400px' }}
      >
        {/* Grid background */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="0.5"
            />
          </pattern>

          {/* Gradients for each room */}
          {roomElements.map((room, idx) => {
            const colors = getGradientColors(idx)
            return (
              <linearGradient key={`gradient-${idx}`} id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.start} stopOpacity="0.3" />
                <stop offset="100%" stopColor={colors.end} stopOpacity="0.3" />
              </linearGradient>
            )
          })}
        </defs>

        {/* Grid background rectangle */}
        <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

        {/* Room rectangles */}
        {roomElements.map((room, idx) => {
          return (
            <g key={idx} className="group cursor-pointer">
              {/* Room rectangle */}
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill={`url(#gradient-${idx})`}
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4,4"
                rx="4"
                className="transition-all duration-300 group-hover:stroke-cyan-400 group-hover:stroke-[3]"
              />

              {/* Room label background */}
              <rect
                x={room.x + 5}
                y={room.y + 5}
                width={room.width - 10}
                height="24"
                fill="rgba(15, 23, 42, 0.8)"
                rx="4"
              />

              {/* Room number and type */}
              <text
                x={room.x + room.width / 2}
                y={room.y + 21}
                textAnchor="middle"
                className="fill-white text-xs font-bold"
                style={{ fontSize: '12px' }}
              >
                #{room.index} {room.type || room.label || 'Room'}
              </text>

              {/* Area */}
              <text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2 + 5}
                textAnchor="middle"
                className="fill-cyan-300 text-sm font-semibold"
                style={{ fontSize: '14px' }}
              >
                {formatArea(room.area_sqft)} sqft
              </text>

              {/* Dimensions */}
              {(room.width_ft && room.length_ft) && (
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 + 22}
                  textAnchor="middle"
                  className="fill-gray-400"
                  style={{ fontSize: '10px' }}
                >
                  {room.width_ft.toFixed(1)}' × {room.length_ft.toFixed(1)}'
                </text>
              )}

              {/* Door indicator */}
              {room.doors > 0 && (
                <g transform={`translate(${room.x + 5}, ${room.y + room.height - 25})`}>
                  <rect width="18" height="18" fill="rgba(59, 130, 246, 0.2)" rx="3" stroke="#3b82f6" strokeWidth="1" />
                  <text x="9" y="13" textAnchor="middle" className="fill-blue-300 font-bold" style={{ fontSize: '10px' }}>
                    D{room.doors}
                  </text>
                </g>
              )}

              {/* Window indicator */}
              {room.windows > 0 && (
                <g transform={`translate(${room.x + room.width - 23}, ${room.y + room.height - 25})`}>
                  <rect width="18" height="18" fill="rgba(251, 191, 36, 0.2)" rx="3" stroke="#fbbf24" strokeWidth="1" />
                  <text x="9" y="13" textAnchor="middle" className="fill-amber-300 font-bold" style={{ fontSize: '10px' }}>
                    W{room.windows}
                  </text>
                </g>
              )}

              {/* Hover effect overlay */}
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill="rgba(6, 182, 212, 0)"
                className="transition-all duration-300 group-hover:fill-[rgba(6,182,212,0.1)]"
                rx="4"
                pointerEvents="all"
              />
            </g>
          )
        })}

        {/* Title */}
        <text
          x={svgWidth / 2}
          y={25}
          textAnchor="middle"
          className="fill-white text-base font-bold"
          style={{ fontSize: '16px' }}
        >
          {projectName}
        </text>

        {/* Scale indicator */}
        <g transform={`translate(${PADDING}, ${svgHeight - 25})`}>
          <line x1="0" y1="10" x2="50" y2="10" stroke="#06b6d4" strokeWidth="2" />
          <line x1="0" y1="7" x2="0" y2="13" stroke="#06b6d4" strokeWidth="2" />
          <line x1="50" y1="7" x2="50" y2="13" stroke="#06b6d4" strokeWidth="2" />
          <text x="25" y="25" textAnchor="middle" className="fill-gray-400" style={{ fontSize: '10px' }}>
            Scale: Proportional to Area
          </text>
        </g>
      </svg>
    </div>
  )
}

// ✅ UPDATED: Annotated Floor Plan Component
const AnnotatedFloorPlan = ({ previewPath, projectName, projectId, rooms }) => {
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

      {/* SVG Floor Plan Generator */}
      <SVGFloorPlanGenerator rooms={rooms} projectName={projectName} />

      {/* Legend */}
      <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-cyan-500/30 border-2 border-cyan-500" />
          <span className="text-gray-300">Room Area</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500/30 border-2 border-blue-500" />
          <span className="text-gray-300">Doors (D)</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-500/30 border-2 border-amber-500" />
          <span className="text-gray-300">Windows (W)</span>
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

        {/* Header */}
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

              {/* Right: Action Buttons */}
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
                rooms={report.rooms}
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