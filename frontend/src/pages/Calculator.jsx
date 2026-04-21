import { useState } from "react"
import API from "../services/api"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import MainLayout from "@/layout/MainLayout"
import CostComparisonChart from "../components/CostComparisonChart"
import MaterialCostPieChart from "../components/MaterialCostPieChart"
import MaterialTable from "../components/MaterialTable"

export default function Calculator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [estimationName, setEstimationName] = useState("")

  const [formData, setFormData] = useState({
    area_sqft: "",
    floors: 1,
    wastage_percent: 5,
    
    steel_rate_per_kg: 70,
    cement_rate_per_bag: 400,
    sand_rate_per_ton: 1200,
    aggregate_rate_per_ton: 1000,
    brick_rate_per_unit: 8,
    paint_rate_per_liter: 20,

    cement_part: 1,
    sand_part: 1.5,
    aggregate_part: 3
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    if (!estimationName.trim()) {
      alert("Please enter an estimation name")
      return
    }

    setLoading(true)

    try {
      const res = await API.post("estimations/manual/", {
        estimation_name: estimationName,
        description: "",
        mix_type: "CUSTOM",
        
        area_sqft: Number(formData.area_sqft),
        floors: Number(formData.floors),
        wastage_percent: Number(formData.wastage_percent),

        steel_rate_per_kg: Number(formData.steel_rate_per_kg),
        cement_rate_per_bag: Number(formData.cement_rate_per_bag),
        sand_rate_per_ton: Number(formData.sand_rate_per_ton),
        aggregate_rate_per_ton: Number(formData.aggregate_rate_per_ton),
        brick_rate_per_unit: Number(formData.brick_rate_per_unit),
        paint_rate_per_liter: Number(formData.paint_rate_per_liter),

        cement_part: Number(formData.cement_part),
        sand_part: Number(formData.sand_part),
        aggregate_part: Number(formData.aggregate_part)
      })

      setResult(res.data)
      console.log("Estimation created:", res.data)

    } catch (err) {
      console.error("Error:", err.response?.data || err.message)
      alert("Calculation failed: " + (err.response?.data?.detail || "Unknown error"))
    }

    setLoading(false)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 text-white px-10 py-16">

        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="text-cyan-400">Manual</span> Estimation Calculator
        </h1>

        {/* FORM SECTION */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">

          {/* ESTIMATION NAME */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Estimation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Estimation Name (e.g., House A, Office Building)"
                value={estimationName}
                onChange={(e) => setEstimationName(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </CardContent>
          </Card>

          {/* PROJECT DETAILS */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                name="area_sqft"
                placeholder="Area (sqft)"
                onChange={handleChange}
                className="bg-slate-950 border-slate-700 text-white"
              />
              <Input
                name="floors"
                placeholder="Floors"
                onChange={handleChange}
                className="bg-slate-950 border-slate-700 text-white"
              />
              <Input
                name="wastage_percent"
                placeholder="Wastage %"
                onChange={handleChange}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </CardContent>
          </Card>

          {/* MIX TYPE */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Custom Concrete Mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                Enter custom mix ratio (Cement : Sand : Aggregate)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  name="cement_part"
                  placeholder="Cement"
                  onChange={handleChange}
                  className="bg-slate-950 border-slate-700 text-white"
                />
                <Input
                  name="sand_part"
                  placeholder="Sand"
                  onChange={handleChange}
                  className="bg-slate-950 border-slate-700 text-white"
                />
                <Input
                  name="aggregate_part"
                  placeholder="Aggregate"
                  onChange={handleChange}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <p className="text-xs text-gray-500">Example: 1 : 1.5 : 3</p>
            </CardContent>
          </Card>

          {/* MATERIAL RATES */}
          <Card className="bg-slate-900 border-slate-800 lg:col-span-2 shadow-xl">
            <CardHeader>
              <CardTitle className="text-cyan-400">Material Rates (per unit)</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Input 
                name="steel_rate_per_kg" 
                placeholder="Steel (₹/kg)" 
                onChange={handleChange} 
                className="bg-slate-950 border-slate-700 text-white"
              />
              <Input 
                name="cement_rate_per_bag" 
                placeholder="Cement (₹/bag)" 
                onChange={handleChange} 
                className="bg-slate-950 border-slate-700 text-white"
              />
              <Input 
                name="sand_rate_per_ton" 
                placeholder="Sand (₹/ton)" 
                onChange={handleChange} 
                className="bg-slate-950 border-slate-700 text-white"
              />
              <Input 
                name="aggregate_rate_per_ton" 
                placeholder="Aggregate (₹/ton)" 
                onChange={handleChange} 
                className="bg-slate-950 border-slate-700 text-white"
              />
              <Input 
                name="brick_rate_per_unit" 
                placeholder="Brick (₹/unit)" 
                onChange={handleChange} 
                className="bg-slate-950 border-slate-700 text-white"
              />
              <Input 
                name="paint_rate_per_liter" 
                placeholder="Paint (₹/liter)" 
                onChange={handleChange} 
                className="bg-slate-950 border-slate-700 text-white"
              />
            </CardContent>
          </Card>

        </div>

        {/* SUBMIT BUTTON */}
        <Button
          className="bg-cyan-500 hover:bg-cyan-600 w-full text-lg mb-16"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Calculating..." : "Generate Estimate"}
        </Button>

        {/* RESULTS SECTION */}
        {result && (
          <div className="space-y-8">
            
            {/* SUMMARY CARD */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-cyan-400">Estimation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded">
                    <p className="text-gray-400 text-sm">Estimation Code</p>
                    <p className="text-xl font-bold text-cyan-400">{result.estimation_code}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded">
                    <p className="text-gray-400 text-sm">Total Cost</p>
                    <p className="text-2xl font-bold text-green-400">₹{result.total_cost?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded">
                    <p className="text-gray-400 text-sm">Created</p>
                    <p className="text-lg font-bold">{new Date(result.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                  onClick={() => window.location.href = `/estimation-report/${result.id}`}
                >
                  View Full Report
                </Button>
              </CardContent>
            </Card>

            {/* VISUALIZATIONS */}
            {result.costs && result.costs.length > 0 && (
              <>
                {/* Material Cost Distribution */}
                <MaterialCostPieChart costData={result.costs} />

                {/* Material Quantities Table */}
                <MaterialTable materials={result.materials} />
              </>
            )}

          </div>
        )}

      </div>
    </MainLayout>
  )
}