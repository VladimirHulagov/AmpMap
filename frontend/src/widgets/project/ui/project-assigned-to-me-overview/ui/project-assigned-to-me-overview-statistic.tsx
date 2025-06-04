import { Flex } from "antd"
import { UNTESTED_STATUS } from "entities/status/model"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Label, PieChart, Pie as PieRechart, ResponsiveContainer, Tooltip } from "recharts"

import { formatStatistics } from "entities/test-plan/lib"

import { StatisticLegend } from "shared/ui"

interface Props {
  statistics: TestPlanStatistics[]
}

export const ProjectAssignedToMeOverviewStatistic = ({ statistics }: Props) => {
  const { t } = useTranslation()

  const formattedData = useMemo(
    () => formatStatistics(statistics.filter((i) => !!i.value)),
    [statistics]
  )

  const statusesTotal = useMemo(() => {
    return statistics.reduce((acc, item) => acc + item.value, 0)
  }, [statistics])

  const untestedTotal = useMemo(() => {
    return statistics
      .filter((item) => item.label !== UNTESTED_STATUS)
      .reduce((acc, item) => acc + item.value, 0)
  }, [statistics])

  return (
    <Flex vertical style={{ width: "100%" }}>
      <Flex gap={32} justify="space-between" style={{ width: "100%" }}>
        <Flex align="center" justify="center" style={{ width: "100%" }}>
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <PieRechart
                data={formattedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={75}
                stroke="var(--y-color-background)"
              >
                <Label
                  value={`${untestedTotal} / ${statusesTotal}`}
                  position="centerBottom"
                  fontSize={26}
                  fill="var(--y-color-control-text)"
                  dy={0}
                  style={{ lineHeight: 24, fontWeight: 400 }}
                />
                <Label
                  position="centerTop"
                  fontSize={16}
                  offset={20}
                  value={t("Progress")}
                  style={{ marginTop: 20, lineHeight: 24, fontWeight: 400 }}
                  dy={10}
                />
              </PieRechart>
              <Tooltip wrapperClassName="recharts-tooltip" />
            </PieChart>
          </ResponsiveContainer>
        </Flex>
        <StatisticLegend data={statistics} />
      </Flex>
    </Flex>
  )
}
