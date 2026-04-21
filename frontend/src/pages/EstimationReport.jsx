import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import API from "../services/api"
import MainLayout from "@/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import MaterialCostPieChart from "../components/MaterialCostPieChart"
import MaterialTable from "../components/MaterialTable"

export default function EstimationReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReport()
  }, [id])

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

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-xl">Loading report...</div>
        </div>
      </MainLayout>
    )
  }

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

  if (!report) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-xl">No data found</div>
        </div>
      </MainLayout>
    )
  }

  let costDataForChart = []
  if (report.costs && Array.isArray(report.costs)) {
    costDataForChart = report.costs.map(cost => ({
      name: cost.material_type ? cost.material_type.charAt(0).toUpperCase() + cost.material_type.slice(1) : 'Unknown',
      value: cost.total_cost || 0
    }))
  }

  const materials = report.materials || {}
  const rates = report.rates || {}

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 text-white px-10 py-16">
        
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">
          Estimation Report
        </h1>

        {/* HEADER INFO */}
        <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-cyan-400">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Estimation Code</p>
              <p className="text-2xl font-bold text-white">{report.estimation_code || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Project Name</p>
              <p className="text-2xl font-bold text-white">{report.estimation_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Area</p>
              <p className="text-xl text-white">{report.area_sqft || 0} sqft ({report.area_m2 || 0} m²)</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Floors</p>
              <p className="text-xl text-white">{report.floors || 1}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Mix Type</p>
              <p className="text-xl text-white">{report.mix_type || 'CUSTOM'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Wastage</p>
              <p className="text-xl text-white">{report.wastage_percent || 0}%</p>
            </div>
          </CardContent>
        </Card>

        {/* MIX RATIO */}
        {report.mix_ratio && (
          <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Concrete Mix Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-2 text-white">
                <span className="text-yellow-400 font-semibold">Cement</span> : 
                <span className="text-orange-400 font-semibold"> Sand</span> : 
                <span className="text-blue-400 font-semibold"> Aggregate</span>
              </p>
              <p className="text-3xl font-bold text-cyan-400">
                {report.mix_ratio.cement} : {report.mix_ratio.sand} : {report.mix_ratio.aggregate}
              </p>
            </CardContent>
          </Card>
        )}

        {/* CONCRETE VOLUMES */}
        {(report.concrete_volume_m3 || report.dry_volume_m3) && (
          <Card className="bg-slate-900 border-slate-800 mb-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Concrete Volumes</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                <p className="text-gray-400 text-sm">Wet Volume</p>
                <p className="text-2xl font-bold text-white">{report.concrete_volume_m3 || 0} m³</p>
              </div>
              <div className="bg-slate-950 p-4 rounded border border-slate-800">
                <p className="text-gray-400 text-sm">Dry Volume</p>
                <p className="text-2xl font-bold text-white">{report.dry_volume_m3 || 0} m³</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MATERIALS */}
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
                    <p className="text-2xl font-bold text-white">{materials.steel_kg} kg</p>
                  </div>
                )}
                {materials.cement_bags && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Cement</p>
                    <p className="text-2xl font-bold text-white">{materials.cement_bags} bags</p>
                  </div>
                )}
                {materials.sand_ton && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Sand</p>
                    <p className="text-2xl font-bold text-white">{materials.sand_ton} tons</p>
                  </div>
                )}
                {materials.aggregate_ton && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Aggregate</p>
                    <p className="text-2xl font-bold text-white">{materials.aggregate_ton} tons</p>
                  </div>
                )}
                {materials.bricks && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Bricks</p>
                    <p className="text-2xl font-bold text-white">{materials.bricks}</p>
                  </div>
                )}
                {materials.paint_liters && (
                  <div className="bg-slate-950 p-4 rounded border border-slate-800">
                    <p className="text-gray-400 text-sm">Paint</p>
                    <p className="text-2xl font-bold text-white">{materials.paint_liters} liters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* MATERIAL RATES USED */}
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
                    <p className="font-bold text-white">₹{rates.cement_per_bag}/bag</p>
                  </div>
                )}
                {rates.sand_per_ton && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Sand Rate</p>
                    <p className="font-bold text-white">₹{rates.sand_per_ton}/ton</p>
                  </div>
                )}
                {rates.aggregate_per_ton && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Aggregate Rate</p>
                    <p className="font-bold text-white">₹{rates.aggregate_per_ton}/ton</p>
                  </div>
                )}
                {rates.brick_per_unit && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Brick Rate</p>
                    <p className="font-bold text-white">₹{rates.brick_per_unit}/unit</p>
                  </div>
                )}
                {rates.paint_per_liter && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-gray-400 text-xs">Paint Rate</p>
                    <p className="font-bold text-white">₹{rates.paint_per_liter}/liter</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* VISUALIZATIONS */}
        {costDataForChart && costDataForChart.length > 0 && (
          <>
            {/* Material Cost Distribution Pie Chart */}
            <MaterialCostPieChart costData={costDataForChart} />

            {/* Material Table */}
            {materials && Object.keys(materials).length > 0 && (
              <MaterialTable materials={materials} />
            )}
          </>
        )}

        {/* TOTAL COST */}
        {report.total_cost && (
          <Card className="bg-slate-900 border-cyan-500 border-2 mb-8 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-2xl font-bold text-white">TOTAL ESTIMATED COST</p>
                <p className="text-4xl font-bold text-green-400">
                  ₹{typeof report.total_cost === 'number' ? report.total_cost.toLocaleString() : report.total_cost}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACTIONS */}
        <div className="flex gap-4 justify-center mb-8 flex-wrap">
          <Button 
            className="bg-cyan-500 hover:bg-cyan-600 px-8 text-white font-semibold"
            onClick={() => window.print()}
          >
            Print Report
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 px-8 text-white font-semibold"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 px-8 text-white font-semibold"
            onClick={() => window.location.href = '/calculator'}
          >
            New Estimate
          </Button>
        </div>

      </div>
    </MainLayout>
  )
}