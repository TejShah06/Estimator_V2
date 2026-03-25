import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import API from "../services/api"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import MainLayout from "@/layout/MainLayout"

export default function Dashboard() {

const navigate = useNavigate()

const [stats,setStats] = useState({
total_calculations:0,
total_cost:0,
recent:[]
})

useEffect(()=>{

fetchStats()

},[])

const fetchStats = async()=>{

try{

const res = await API.get("/calculator/stats")

setStats(res.data)

}catch(err){

console.log(err)

}

}

return(
<MainLayout>
<div className="min-h-screen bg-slate-950 text-white p-10">

{/* TITLE */}

<h1 className="text-4xl font-bold text-cyan-400 mb-10">

Engineer Dashboard

</h1>

{/* STATS */}

<div className="grid md:grid-cols-3 gap-6 mb-12">

<Card className="bg-slate-900 border-slate-800">

<CardHeader>
<CardTitle>Total Calculations</CardTitle>
</CardHeader>

<CardContent>
<p className="text-3xl text-cyan-400">
{stats.total_calculations}
</p>
</CardContent>

</Card>


<Card className="bg-slate-900 border-slate-800">

<CardHeader>
<CardTitle>Total Estimated Cost</CardTitle>
</CardHeader>

<CardContent>
<p className="text-3xl text-cyan-400">
₹{stats.total_cost}
</p>
</CardContent>

</Card>


<Card className="bg-slate-900 border-slate-800">

<CardHeader>
<CardTitle>AI Floorplan</CardTitle>
</CardHeader>

<CardContent>

<Button
className="bg-cyan-500 hover:bg-cyan-600"
onClick={()=>navigate("/floorplan")}
>

Upload Floorplan

</Button>

</CardContent>

</Card>

</div>


{/* QUICK ACTIONS */}

<h2 className="text-2xl font-bold mb-6">

Quick Actions

</h2>

<div className="grid md:grid-cols-3 gap-6 mb-12">

<Card
className="bg-slate-900 border-slate-800 cursor-pointer hover:border-cyan-400"
onClick={()=>navigate("/calculator")}
>

<CardContent className="p-6">

<h3 className="text-xl font-bold text-cyan-400">

Concrete Calculator

</h3>

<p className="text-gray-400 mt-2">

Estimate concrete and materials instantly.

</p>

</CardContent>

</Card>


<Card
className="bg-slate-900 border-slate-800 cursor-pointer hover:border-cyan-400"
onClick={()=>navigate("/history")}
>

<CardContent className="p-6">

<h3 className="text-xl font-bold text-cyan-400">

Calculation History

</h3>

<p className="text-gray-400 mt-2">

View previous project estimates.

</p>

</CardContent>

</Card>


<Card
className="bg-slate-900 border-slate-800 cursor-pointer hover:border-cyan-400"
onClick={()=>navigate("/profile")}
>

<CardContent className="p-6">

<h3 className="text-xl font-bold text-cyan-400">

Engineer Profile

</h3>

<p className="text-gray-400 mt-2">

Manage account settings.

</p>

</CardContent>

</Card>

</div>


{/* RECENT CALCULATIONS */}

<h2 className="text-2xl font-bold mb-6">

Recent Calculations

</h2>

<div className="grid md:grid-cols-3 gap-6">

{stats.recent?.map((calc,i)=>(

<Card key={i} className="bg-slate-900 border-slate-800">

<CardContent className="p-6">

<p className="text-gray-400">
Area
</p>

<p className="text-xl">
{calc.area_sqft} sqft
</p>

<p className="text-gray-400 mt-3">
Cost
</p>

<p className="text-cyan-400 text-xl">
₹{calc.total_cost}
</p>

</CardContent>

</Card>

))}

</div>

</div>
</MainLayout>
)

}