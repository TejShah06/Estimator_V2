
import { useEffect, useState } from "react"
import { ScrollText, Trash2, Settings, UserX, UserCheck } from "lucide-react"
import { getActivityLogs } from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

const getActionIcon = (action) => {
  if (action.includes("deleted")) return <Trash2 className="w-4 h-4 text-red-400" />
  if (action.includes("deactivated")) return <UserX className="w-4 h-4 text-amber-400" />
  if (action.includes("activated")) return <UserCheck className="w-4 h-4 text-green-400" />
  if (action.includes("setting")) return <Settings className="w-4 h-4 text-blue-400" />
  return <ScrollText className="w-4 h-4 text-gray-400" />
}

const getActionColor = (action) => {
  if (action.includes("deleted")) return "bg-red-500/10 border-red-500/20"
  if (action.includes("deactivated")) return "bg-amber-500/10 border-amber-500/20"
  if (action.includes("activated")) return "bg-green-500/10 border-green-500/20"
  if (action.includes("setting")) return "bg-blue-500/10 border-blue-500/20"
  return "bg-slate-800/50 border-slate-700"
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await getActivityLogs({ limit: 50 })
      setLogs(res.data.logs)
      setTotal(res.data.total)
    } catch (err) {
      console.error("Error:", err)
    }
    setLoading(false)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-400 mt-1">Total: {total} log entries</p>
        </div>

        {/* Logs */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
            ))
          ) : logs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No activity logs yet</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-start gap-4 p-4 rounded-xl border ${getActionColor(log.action)}`}
              >
                <div className="p-2 bg-slate-800 rounded-lg mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize">
                    {log.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">
                    {log.description}
                  </p>
                </div>
                <p className="text-gray-500 text-xs whitespace-nowrap mt-1">
                  {log.performed_at
                    ? new Date(log.performed_at).toLocaleString("en-IN")
                    : "—"
                  }
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </AdminLayout>
  )
}