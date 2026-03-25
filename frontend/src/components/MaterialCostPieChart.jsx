import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"

const COLORS = [
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6"
]

export default function MaterialCostPieChart({ costData }) {

  const data = [
    { name: "Steel", value: costData.steel_cost },
    { name: "Cement", value: costData.cement_cost },
    { name: "Sand", value: costData.sand_cost },
    { name: "Aggregate", value: costData.aggregate_cost },
    { name: "Brick", value: costData.brick_cost },
    { name: "Paint", value: costData.paint_cost }
  ]

  return (

    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">

      <h2 className="text-xl font-semibold mb-4 text-cyan-400">
        Material Cost Distribution
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >

            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}

          </Pie>

          <Tooltip/>

        </PieChart>

      </ResponsiveContainer>

    </div>

  )

}