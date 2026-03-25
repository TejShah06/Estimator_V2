import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

export default function CostComparisonChart({ result }) {

  const data = [
    { name: "M20", cost: result.m20.total_cost },
    { name: "M25", cost: result.m25.total_cost },
    { name: "Custom", cost: result.custom.total_cost }
  ]

  return (

    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">

      <h2 className="text-xl font-semibold mb-4 text-cyan-400">
        Cost Comparison
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <BarChart data={data}>

          <CartesianGrid strokeDasharray="3 3" stroke="#444"/>

          <XAxis dataKey="name" stroke="#aaa"/>
          <YAxis stroke="#aaa"/>

          <Tooltip />

          <Bar dataKey="cost" fill="#06b6d4"/>

        </BarChart>

      </ResponsiveContainer>

    </div>

  )

}