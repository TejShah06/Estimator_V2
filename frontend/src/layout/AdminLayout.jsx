
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  BarChart2,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronRight,
} from "lucide-react"

const navItems = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    path: "/admin/projects",
    label: "Projects",
    icon: FolderOpen,
  },
  {
    path: "/admin/analytics",
    label: "Analytics",
    icon: BarChart2,
  },
  {
    path: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    path: "/admin/logs",
    label: "Activity Logs",
    icon: ScrollText,
  },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const username = localStorage.getItem("username") || "Admin"

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Building2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">AI Estimator</p>
            <p className="text-cyan-400 text-xs font-semibold">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{username}</p>
            <p className="text-gray-400 text-xs">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 4 }}
              onClick={() => {
                navigate(item.path)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-gray-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col fixed h-full z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 w-64 h-full bg-slate-900 border-r border-slate-800 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-gray-400"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-400 text-sm">System Active</span>
          </div>

          <div className="text-gray-400 text-sm hidden md:block">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}