import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import API from "../services/api"
import MainLayout from "@/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import MaterialCostPieChart from "../components/MaterialCostPieChart"
import MaterialTable from "../components/MaterialTable"
import { Download, Lock, Loader2 } from "lucide-react"
import UpgradePopup from "@/components/UpgradePopup"
import {
  checkDownloadPermission,
  downloadManualReportPdf,
} from "@/services/subscriptionApi"

export default function EstimationReport() {
  const { id } = useParams()

  // ── Existing state ─────────────────────────────────────────────────────────
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── NEW: PDF permission + download state ───────────────────────────────────
  const [canDownloadPdf, setCanDownloadPdf] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [upgradeOpen,    setUpgradeOpen]    = useState(false)
  const [permLoading,    setPermLoading]    = useState(true)

  useEffect(() => {
    fetchReport()
    checkPermission()
  }, [id])

  // ── Fetch report ───────────────────────────────────────────────────────────
  const fetchReport = async () => {
    try {
      const res = await API.get(`estimations/manual/${id}/report`)
      console.log("Full report data:", res.data)
      setReport(res.data)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to load report"
      console.error("Error fetching report:", err)
      setError(errorMsg)
    }
    setLoading(false)
  }

  // ── Check PDF permission ───────────────────────────────────────────────────
  const checkPermission = async () => {
    try {
      setPermLoading(true)
      const res = await checkDownloadPermission("manual")
      setCanDownloadPdf(res.data.allowed)
    } catch (err) {
      console.error("Permission check failed:", err)
      setCanDownloadPdf(false)
    } finally {
      setPermLoading(false)
    }
  }

  // ── PDF Download ───────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!canDownloadPdf) {
      setUpgradeOpen(true)
      return
    }

    try {
      setDownloadingPdf(true)
      const res = await downloadManualReportPdf(id)

      // Trigger browser download
      const blob     = new Blob([res.data], { type: "application/pdf" })
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement("a")
      a.href         = url
      a.download     = `Manual_Report_${report?.estimation_name || id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error("PDF download failed:", err)
      if (err.response?.status === 403) {
        setUpgradeOpen(true)
      } else {
        alert("Failed to download PDF. Please try again.")
      }
    } finally {
      setDownloadingPdf(false)
    }
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-xl">Loading report...</div>
        </div>
      </MainLayout>
    )
  }

  // ── Error screen ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <Card className="bg-red-900 border-red-800 max-w-md">
            <CardContent className="pt-6">
              <p className="text-red-200">{error}</p>
              <Button
                className="mt-4 bg-red-700 hover:bg-red-600 w-full"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // ── No data ────────────────────────────────────────────────────────────────
  if (!report) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-xl">No data found</div>
        </div>
      </MainLayout>
    )
  }

  // ── Prepare chart data ─────────────────────────────────────────────────────
  let costDataForChart = []
  if (report.costs && Array.isArray(report.costs)) {
    costDataForChart = report.costs.map((cost) => ({
      name: cost.material_type
        ? cost.material_type.charAt(0).toUpperCase() + cost.material_type.slice(1)
        : "Unknown",
      value: cost.total_cost || 0,
    }))
  }

  const materials = report.materials || {}
  const rates     = report.rates     || {}

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 text-white px-6 md:px-10 py-16">

        {/* Page Title */}
        <h1 className="text-4xl font-bold mb-4 text-cyan-400">
          Estimation Report
        </h1>

        {/* ── PDF Lock Banner (only if not allowed) ───────────────────────── */}
        {!permLoading && !canDownloadPdf && (
          <div className="mb-8 p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-200">
                PDF download is available on{" "}
                <span className="font-semibold text-white">Basic</span>,{" "}
                <span className="font-semibold text-white">Advanced</span> and{" "}
                <span className="font-semibold text-white">Extreme</span> plans.
              </p>
            </div>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm font-medium border border-amber-400/30 transition-colors whitespace-nowrap"
            >
              View Plans
            </button>
          </div>
        )}

        {/* ── PROJECT INFORMATION ──────────────────────────────────────────── */}
        <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-cyan-400">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Estimation Code</p>
              <p className="text-2xl font-bold text-white">
                {report.estimation_code || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Project Name</p>
              <p className="text-2xl font-bold text-white">
                {report.estimation_name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Area</p>
              <p className="text-xl text-white">
                {report.area_sqft || 0} sqft ({report.area_m2 || 0} m²)
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Floors</p>
              <p className="text-xl text-white">{report.floors || 1}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Mix Type</p>
              <p className="text-xl text-white">{report.mix_type || "CUSTOM"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Wastage</p>
              <p className="text-xl text-white">{report.wastage_percent || 0}%</p>
            </div>
          </CardContent>
        </Card>

        {/* ── MIX RATIO ────────────────────────────────────────────────────── */}
        {report.mix_ratio && (
          <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Concrete Mix Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-2 text-white">
                <span className="text-yellow-400 font-semibold">Cement</span> :{" "}
                <span className="text-orange-400 font-semibold">Sand</span> :{" "}
                <span className="text-blue-400 font-semibold">Aggregate</span>
              </p>
              <p className="text-3xl font-bold text-cyan-400">
                {report.mix_ratio.cement} : {report.mix_ratio.sand} :{" "}
                {report.mix_ratio.aggregate}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── CONCRETE VOLUMES ─────────────────────────────────────────────── */}
        {(report.concrete_volume_m3 || report.dry_volume_m3) && (
          <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Concrete Volumes</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                <p className="text-gray-400 text-sm">Wet Volume</p>
                <p className="text-2xl font-bold text-white">
                  {report.concrete_volume_m3 || 0} m³
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                <p className="text-gray-400 text-sm">Dry Volume</p>
                <p className="text-2xl font-bold text-white">
                  {report.dry_volume_m3 || 0} m³
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── MATERIALS REQUIRED ───────────────────────────────────────────── */}
        {Object.keys(materials).length > 0 && (
          <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Materials Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.steel_kg && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Steel</p>
                    <p className="text-2xl font-bold text-white">
                      {materials.steel_kg} kg
                    </p>
                  </div>
                )}
                {materials.cement_bags && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Cement</p>
                    <p className="text-2xl font-bold text-white">
                      {materials.cement_bags} bags
                    </p>
                  </div>
                )}
                {materials.sand_ton && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Sand</p>
                    <p className="text-2xl font-bold text-white">
                      {materials.sand_ton} tons
                    </p>
                  </div>
                )}
                {materials.aggregate_ton && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Aggregate</p>
                    <p className="text-2xl font-bold text-white">
                      {materials.aggregate_ton} tons
                    </p>
                  </div>
                )}
                {materials.bricks && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Bricks</p>
                    <p className="text-2xl font-bold text-white">
                      {materials.bricks}
                    </p>
                  </div>
                )}
                {materials.paint_liters && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Paint</p>
                    <p className="text-2xl font-bold text-white">
                      {materials.paint_liters} liters
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── MATERIAL RATES USED ──────────────────────────────────────────── */}
        {Object.keys(rates).length > 0 && (
          <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Material Rates Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rates.steel_per_kg && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Steel Rate</p>
                    <p className="font-bold text-white">₹{rates.steel_per_kg}/kg</p>
                  </div>
                )}
                {rates.cement_per_bag && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Cement Rate</p>
                    <p className="font-bold text-white">
                      ₹{rates.cement_per_bag}/bag
                    </p>
                  </div>
                )}
                {rates.sand_per_ton && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Sand Rate</p>
                    <p className="font-bold text-white">
                      ₹{rates.sand_per_ton}/ton
                    </p>
                  </div>
                )}
                {rates.aggregate_per_ton && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Aggregate Rate</p>
                    <p className="font-bold text-white">
                      ₹{rates.aggregate_per_ton}/ton
                    </p>
                  </div>
                )}
                {rates.brick_per_unit && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Brick Rate</p>
                    <p className="font-bold text-white">
                      ₹{rates.brick_per_unit}/unit
                    </p>
                  </div>
                )}
                {rates.paint_per_liter && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Paint Rate</p>
                    <p className="font-bold text-white">
                      ₹{rates.paint_per_liter}/liter
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── VISUALIZATIONS ───────────────────────────────────────────────── */}
        {costDataForChart && costDataForChart.length > 0 && (
          <>
            <MaterialCostPieChart costData={costDataForChart} />
            {materials && Object.keys(materials).length > 0 && (
              <MaterialTable materials={materials} />
            )}
          </>
        )}

        {/* ── TOTAL COST ───────────────────────────────────────────────────── */}
        {report.total_cost && (
          <Card className="bg-slate-900 border-cyan-500 border-2 mb-8 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <p className="text-2xl font-bold text-white">
                  TOTAL ESTIMATED COST
                </p>
                <p className="text-4xl font-bold text-green-400">
                  ₹
                  {typeof report.total_cost === "number"
                    ? report.total_cost.toLocaleString()
                    : report.total_cost}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────────────── */}
        <div className="flex gap-4 justify-center mb-8 flex-wrap">

          {/*   PDF Download Button */}
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || permLoading}
            className={`px-8 font-semibold flex items-center gap-2 ${
              canDownloadPdf
                ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-gray-300"
            }`}
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : canDownloadPdf ? (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Download PDF
              </>
            )}
          </Button>

          {/* Print */}
          <Button
            className="bg-slate-600 hover:bg-slate-500 px-8 text-white font-semibold"
            onClick={() => window.print()}
          >
            Print Report
          </Button>

          {/* Back */}
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-8 text-white font-semibold"
            onClick={() => window.history.back()}
          >
            Back
          </Button>

          {/* New Estimate */}
          <Button
            className="bg-purple-600 hover:bg-purple-700 px-8 text-white font-semibold"
            onClick={() => (window.location.href = "/calculator")}
          >
            New Estimate
          </Button>

        </div>

      </div>

      {/*   Upgrade Popup */}
      <UpgradePopup
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Download Manual Reports"
        message="Manual Estimation PDF downloads are available on all plans including Basic (Free). Please refresh the page and try again, or contact support."
      />

    </MainLayout>
  )
}