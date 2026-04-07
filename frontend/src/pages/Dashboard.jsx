import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  getDashboardStats,
  getRecentProjects,
  analyzeFloorplan
} from "../services/api"

import StatsCards from "../components/dashboard/StatsCards"
import RecentProjects from "../components/dashboard/RecentProjects"
import QuickUpload from "../components/dashboard/QuickUpload"
import CostTrendChart from "../components/dashboard/CostTrendChart"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const Dashboard = () => {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    total_projects: 0,
    ai_projects: 0,
    manual_projects: 0,
    total_cost: 0,
    total_area_sqft: 0,
    total_rooms: 0
  })

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchProjects()])
      setLoading(false)
    }
    loadData()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats()
      setStats(res.data)
    } catch (err) {
      console.error("Stats error:", err)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await getRecentProjects()
      setProjects(res.data || [])
    } catch (err) {
      console.error("Projects error:", err)
    }
  }

  const handleAnalyze = useCallback(async (file) => {
    if (!file) return

    setAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisResult(null)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 500)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await analyzeFloorplan(formData)
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      setAnalysisResult(res.data)
      await Promise.all([fetchStats(), fetchProjects()])

      setTimeout(() => {
        navigate("/report", { state: { result: res.data } })
      }, 1500)
    } catch (err) {
      console.error("Analysis failed:", err)
      clearInterval(progressInterval)
      setAnalysisProgress(0)
      setAnalyzing(false)
    }
  }, [navigate])

  /* ── Get current hour for greeting ── */
  const hour = new Date().getHours()
  let greeting = "Good Morning"
  if (hour >= 12 && hour < 17) greeting = "Good Afternoon"
  else if (hour >= 17) greeting = "Good Evening"

  const username = localStorage.getItem("username") || "Builder"

  return (
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 space-y-6"
    >
        <Navbar />
      {/* ── Welcome Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-white text-2xl md:text-3xl font-bold ">
            HELLO..{greeting}, {username}! 
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your construction estimates
          </p>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="hidden md:flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full"
        >
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-white text-sm text-primary font-medium">
            AI Pipeline Ready
          </span>
        </motion.div>
      </motion.div>

      {/* ── Stats Cards ── */}
      <StatsCards stats={stats} loading={loading} />

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentProjects
            projects={projects}
            loading={loading}
            onViewAll={() => navigate("/projects")}
            onProjectsChange={fetchProjects}
          />
        </div>
        <div className="lg:col-span-2">
          <QuickUpload
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
            progress={analysisProgress}
            result={analysisResult}
          />
        </div>
      </div>

      {/* ── Cost Trend Chart ── */}
      <CostTrendChart projects={projects} />
      <Footer/>
    </motion.div>
  )
}

export default Dashboard