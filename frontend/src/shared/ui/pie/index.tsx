import { Flex } from "antd"
import { useTranslation } from "react-i18next"
import { Label, PieChart, Pie as PieRechart, ResponsiveContainer, Tooltip } from "recharts"

import { StatisticLegend } from "../statistic-legend/statistic-legend"
import { usePie } from "./model/use-pie"

interface PieProps {
  data: TestPlanStatistics[]
  statuses: string[]
  type: "value" | "estimates"
  height?: number
  onHeightChange?: (height: number) => void
}

export const Pie = ({ data, statuses, type, height = 208, onHeightChange }: PieProps) => {
  const { t } = useTranslation()
  const { formatData, total, legendFormatter, tooltipFormatter, chartRef } = usePie({
    data: data ?? [],
    statuses,
    type,
    onHeightChange,
  })

  return (
    <Flex gap={32} justify="space-between" style={{ width: "100%" }}>
      <Flex align="center" justify="center" style={{ margin: "0 auto" }}>
        <ResponsiveContainer
          width={200}
          height={height}
          ref={chartRef}
          id="test-plan-pie-container"
        >
          <PieChart>
            <PieRechart
              data={formatData}
              dataKey={type}
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={84}
              outerRadius={94}
              stroke="var(--y-color-background)"
            >
              <Label
                value={parseFloat(total.toFixed(2))}
                position="centerBottom"
                fontSize={26}
                fill="var(--y-color-control-text)"
                style={{ lineHeight: 24, fontWeight: 400 }}
                dy={0}
              />
              <Label
                position="centerTop"
                fontSize={16}
                offset={20}
                value={t("Total")}
                style={{ marginTop: 20, lineHeight: 24, fontWeight: 400 }}
                dy={10}
              />
            </PieRechart>
            <Tooltip wrapperClassName="recharts-tooltip" formatter={tooltipFormatter} />
          </PieChart>
        </ResponsiveContainer>
      </Flex>
      <Flex style={{ paddingTop: 16, paddingBottom: 16 }}>
        <StatisticLegend
          data={formatData}
          renderStatus={legendFormatter}
          testid={type === "value" ? "test-plan-pie-count" : "test-plan-pie-estimates"}
        />
      </Flex>
    </Flex>
  )
}
