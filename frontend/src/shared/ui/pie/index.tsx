import { Label, Legend, PieChart, Pie as PieRechart, ResponsiveContainer, Tooltip } from "recharts"

import { PieCellList } from "./cell-list"
import { usePie } from "./model/use-pie"

interface PieProps {
  data: TestPlanStatistics[]
  tableParams: TestTableParams
  setTableParams: (params: TestTableParams) => void
  type: "value" | "estimates"
}

export const Pie = ({ data, tableParams, setTableParams, type }: PieProps) => {
  const { formatData, total, legendFormatter, tooltipFormatter, handleCellClick, checkActive } =
    usePie({
      data: data ?? [],
      tableParams,
      setTableParams,
      type,
    })

  return (
    <ResponsiveContainer width="100%">
      <PieChart>
        <PieRechart
          data={formatData}
          dataKey={type}
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={140}
          fill="#a0a0a0"
        >
          <PieCellList
            data={formatData}
            checkActive={checkActive}
            handleCellClick={handleCellClick}
          />
          <Label position="centerBottom" fontSize={26} value="Total" />
          <Label
            value={total}
            position="centerTop"
            offset={20}
            fontSize={28}
            style={{ marginTop: 20 }}
            dy={12}
            fill="#000"
            fontWeight="bold"
          />
        </PieRechart>
        <Legend
          iconSize={10}
          width={240}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="circle"
          formatter={legendFormatter}
        />
        <Tooltip formatter={tooltipFormatter} />
        <span>123123</span>
      </PieChart>
    </ResponsiveContainer>
  )
}
