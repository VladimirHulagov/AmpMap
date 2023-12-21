import { useMemo } from "react"
import { Label, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { PieCellList } from "shared/ui"
import { usePie } from "shared/ui/pie/model/use-pie"

interface Props {
  data: TestPlanStatistics[]
  tableParams: TestTableParams
  setTableParams: (params: TestTableParams) => void
  period: EstimatePeriod
}

export const TestPlanPieEstimates = ({ data, setTableParams, tableParams, period }: Props) => {
  const { formatData, total, legendFormatter, tooltipFormatter, handleCellClick, checkActive } =
    usePie({
      data: data ?? [],
      tableParams,
      setTableParams,
      type: "estimates",
      period,
    })

  const estimatesStats = useMemo(() => {
    const empty = data.reduce(
      (acc, item) => (item.label === "UNTESTED" ? acc : acc + item.empty_estimates),
      0
    ) // left number
    const total = data.reduce((acc, item) => acc + item.empty_estimates, 0) // right number
    return {
      empty,
      total,
    }
  }, [formatData])

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%">
        <PieChart>
          <Pie
            data={formatData}
            dataKey="estimates"
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
              value={parseFloat(total.toFixed(2))}
              position="centerTop"
              offset={20}
              fontSize={28}
              style={{ marginTop: 20 }}
              dy={12}
              fill="#000"
              fontWeight="bold"
            />
          </Pie>
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
      <span style={{ marginLeft: 150, fontSize: 15 }}>
        Not estimated tests statistics: {`${estimatesStats.empty}/${estimatesStats.total}`}
      </span>
    </div>
  )
}
