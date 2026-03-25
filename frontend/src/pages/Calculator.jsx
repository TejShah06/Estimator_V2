import { useState } from "react"
import API from "../services/api"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select"
import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import MainLayout from "@/layout/MainLayout"
import CostComparisonChart from "../components/CostComparisonChart"
import MaterialCostPieChart from "../components/MaterialCostPieChart"
import MaterialTable from "../components/MaterialTable"
export default function Calculator() {

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [mixType, setMixType] = useState("CUSTOM")

  const [formData, setFormData] = useState({

    area_sqft: "",
    floors: 1,
    wastage_percent: 5,

    cement_rate: 400,
    sand_rate: 1200,
    aggregate_rate: 1000,
    steel_rate: 70,
    brick_rate: 8,
    paint_rate: 20,

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

    setLoading(true)

    try {

      const res = await API.post("/calculator/", {

        ...formData,
        mix_type: mixType,

        area_sqft: Number(formData.area_sqft),
        floors: Number(formData.floors),
        wastage_percent: Number(formData.wastage_percent),

        cement_rate: Number(formData.cement_rate),
        sand_rate: Number(formData.sand_rate),
        aggregate_rate: Number(formData.aggregate_rate),
        steel_rate: Number(formData.steel_rate),
        brick_rate: Number(formData.brick_rate),
        paint_rate: Number(formData.paint_rate),

        cement_part: Number(formData.cement_part),
        sand_part: Number(formData.sand_part),
        aggregate_part: Number(formData.aggregate_part)

      })

      setResult(res.data)

    } catch (err) {

      console.error(err)
      alert("Calculation failed")

    }

    setLoading(false)
  }

  return (

    
<MainLayout>
<div className="min-h-screen bg-slate-950 text-white px-10 py-16">

<h1 className="text-5xl font-bold mb-12 text-center">
<span className="text-cyan-400">AI Construction</span> Estimator
</h1>

<div className="grid lg:grid-cols-2 gap-8">

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
Enter custom mix ratio (Cement : Sand : Aggregate). 
Standard M20 and M25 mixes will be calculated automatically.
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

<p className="text-xs text-gray-500">
Example: 1 : 1.5 : 3
</p>

</CardContent>
</Card>

{/* MATERIAL RATES */}

<Card className="bg-slate-900 border-slate-800 lg:col-span-2 shadow-xl">

<CardHeader>
<CardTitle className="text-cyan-400">Material Rates</CardTitle>
</CardHeader>

<CardContent className="grid md:grid-cols-3 gap-4">

<Input name="steel_rate" placeholder="Steel Rate ₹" onChange={handleChange} className="bg-slate-950 border-slate-700 text-white"/>
<Input name="cement_rate" placeholder="Cement Rate ₹" onChange={handleChange} className="bg-slate-950 border-slate-700 text-white"/>
<Input name="sand_rate" placeholder="Sand Rate ₹" onChange={handleChange} className="bg-slate-950 border-slate-700 text-white"/>

<Input name="aggregate_rate" placeholder="Aggregate Rate ₹" onChange={handleChange} className="bg-slate-950 border-slate-700 text-white"/>
<Input name="brick_rate" placeholder="Brick Rate ₹" onChange={handleChange} className="bg-slate-950 border-slate-700 text-white"/>
<Input name="paint_rate" placeholder="Paint Rate ₹" onChange={handleChange} className="bg-slate-950 border-slate-700 text-white"/>

</CardContent>

</Card>

</div>

<Button
className="mt-12 bg-cyan-500 hover:bg-cyan-600 w-full text-lg"
onClick={handleSubmit}
>
{loading ? "Calculating..." : "Generate Estimate"}
</Button>

{/* RESULTS */}
{result && (

<div className="mt-16 space-y-10">

<CostComparisonChart result={result} />

<MaterialCostPieChart costData={result.m20.cost_breakdown} />

<MaterialTable materials={result.m20.materials} />

</div>

  
)}

</div>  
</MainLayout>

  ) }
