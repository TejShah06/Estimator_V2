
import { useEffect, useState } from "react"
import { Settings, Save } from "lucide-react"
import { getSettings, updateSettings } from "../../services/adminApi"
import AdminLayout from "../../layout/AdminLayout"

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await getSettings()
      setSettings(res.data)
    } catch (err) {
      console.error("Error:", err)
    }
    setLoading(false)
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const payload = Object.fromEntries(
        Object.entries(settings).map(([key, data]) => [key, data.value])
      )
      await updateSettings(payload)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      alert("Failed to save settings")
    }
    setSaving(false)
  }

  const settingLabels = {
    steel_rate_per_kg: { label: "Steel Rate", unit: "₹/kg" },
    cement_rate_per_bag: { label: "Cement Rate", unit: "₹/bag" },
    sand_rate_per_ton: { label: "Sand Rate", unit: "₹/ton" },
    aggregate_rate_per_ton: { label: "Aggregate Rate", unit: "₹/ton" },
    brick_rate_per_unit: { label: "Brick Rate", unit: "₹/unit" },
    paint_rate_per_liter: { label: "Paint Rate", unit: "₹/liter" },
    default_wastage_percent: { label: "Default Wastage", unit: "%" },
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Default Settings</h1>
          <p className="text-gray-400 mt-1">Set default material rates for all users</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm">
              Settings saved successfully!
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">Material Rates</h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading settings...</div>
          ) : (
            Object.entries(settingLabels).map(([key, meta]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{meta.label}</p>
                  <p className="text-gray-400 text-xs">
                    {settings[key]?.description || ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings[key]?.value || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-28 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 text-right"
                  />
                  <span className="text-gray-400 text-sm w-16">{meta.unit}</span>
                </div>
              </div>
            ))
          )}

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}