import { Empty, Flex, Typography } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Label, PieChart, Pie as PieRechart, ResponsiveContainer, Tooltip } from "recharts"

import { useGetTestPlanStatisticsQuery } from "entities/test-plan/api"
import { formatStatistics } from "entities/test-plan/lib"

import { useProjectContext } from "pages/project"

import { ContainerLoader, StatisticLegend } from "shared/ui"

export const ProjectStatusesOverview = () => {
  const { t } = useTranslation()
  const project = useProjectContext()

  const { data = [], isFetching } = useGetTestPlanStatisticsQuery({
    project: project.id,
    parent: null,
  })

  const formattedData = useMemo(
    () => formatStatistics(data?.filter((i) => !!i.value) ?? []),
    [data]
  )

  const total = useMemo(() => {
    return formattedData.reduce((acc, curr) => acc + curr.value, 0)
  }, [formattedData])

  return (
    <Flex vertical style={{ width: "100%" }}>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        {t("Statuses")}
      </Typography.Title>
      {isFetching && (
        <Flex align="center" justify="center" flex={1}>
          <ContainerLoader />
        </Flex>
      )}
      {!isFetching && !formattedData.length && (
        <Flex align="center" justify="center" flex={1}>
          <Empty style={{ margin: "16px 0" }} />
        </Flex>
      )}
      {!isFetching && !!formattedData.length && (
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
                    value={total}
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
                <Tooltip wrapperClassName="recharts-tooltip" />
              </PieChart>
            </ResponsiveContainer>
          </Flex>
          <StatisticLegend data={data} />
        </Flex>
      )}
    </Flex>
  )
}
