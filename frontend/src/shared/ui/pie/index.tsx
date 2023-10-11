import {
  Cell,
  Label,
  Legend,
  PieChart,
  Pie as PieRechart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { colors } from "shared/config"

import { usePie } from "./model/use-pie"
import styles from "./styles.module.css"

interface PieProps {
  data: ITestPlanStatistics[]
  tableParams: TestTableParams
  setTableParams: (params: TestTableParams) => void
}

export const Pie = ({ data, tableParams, setTableParams }: PieProps) => {
  const { formatData, total, legendFormatter, tooltipFormatter, handleCellClick, checkActive } =
    usePie({
      data: data || [],
      tableParams,
      setTableParams,
    })

  return (
    <ResponsiveContainer width="100%">
      <PieChart>
        <PieRechart
          data={formatData}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={140}
          fill="#a0a0a0"
        >
          {formatData.map((entry, index) => (
            <Cell
              className={styles.cell}
              key={`cell-${index}`}
              fill={entry.fill}
              stroke={(checkActive(entry.label) && colors.accent) || undefined}
              onClick={() => handleCellClick(entry)}
            />
          ))}
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
      </PieChart>
    </ResponsiveContainer>
  )
}
