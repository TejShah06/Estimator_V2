export default function MaterialTable({ materials }) {

  return (

    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">

      <h2 className="text-xl font-semibold mb-4 text-cyan-400">
        Material Quantities
      </h2>

      <table className="w-full text-left">

        <thead className="text-gray-400 border-b border-slate-700">

          <tr>
            <th className="py-2">Material</th>
            <th className="py-2">Quantity</th>
          </tr>

        </thead>

        <tbody className="text-gray-300">

          <tr>
            <td className="py-2">Steel</td>
            <td>{materials.steel_kg} kg</td>
          </tr>

          <tr>
            <td className="py-2">Cement</td>
            <td>{materials.cement_bags} bags</td>
          </tr>

          <tr>
            <td className="py-2">Sand</td>
            <td>{materials.sand_ton} ton</td>
          </tr>

          <tr>
            <td className="py-2">Aggregate</td>
            <td>{materials.aggregate_ton} ton</td>
          </tr>

          <tr>
            <td className="py-2">Bricks</td>
            <td>{materials.bricks}</td>
          </tr>

          <tr>
            <td className="py-2">Paint</td>
            <td>{materials.paint_liters} liters</td>
          </tr>

        </tbody>

      </table>

    </div>

  )

}