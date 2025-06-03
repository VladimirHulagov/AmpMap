import { Flex, Spin } from "antd"
import { useMeContext } from "processes"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { useAppSelector } from "app/hooks"

import { selectFilter } from "entities/test/model"

import { useTestPlanContext } from "pages/project"

import { DEFAULT_ESTIMATE_PERIOD } from "shared/constants"
import { StatisticLegend } from "shared/ui"
import { usePie } from "shared/ui/pie/model/use-pie"

import styles from "../styles.module.css"
import { TestPlanPieEstimatesFilters } from "./test-plan-pie-estimates-filters"

interface Props {
  data: TestPlanStatistics[]
  isLoading: boolean
  height: number
  period: EstimatePeriod
  onHeightChange: (height: number) => void
  onPeriodChange: (period: EstimatePeriod) => void
}

export const TestPlanPieEstimates = ({
  data,
  isLoading,
  height,
  period,
  onPeriodChange,
  onHeightChange,
}: Props) => {
  const { t } = useTranslation()
  const testsFilter = useAppSelector(selectFilter)
  const { testPlan } = useTestPlanContext()

  const { userConfig, updateConfig } = useMeContext()

  const { formatData, total, legendFormatter, tooltipFormatter, chartRef } = usePie({
    data,
    type: "estimates",
    period,
    statuses: testsFilter.statuses,
    onHeightChange,
  })

  const estimatesStats = useMemo(() => {
    const empty = (data ?? []).reduce(
      (acc, item) => (item.label === "UNTESTED" ? acc : acc + item.empty_estimates),
      0
    ) // left number
    const newTotal = (data ?? []).reduce((acc, item) => acc + item.empty_estimates, 0) // right number
    return {
      empty,
      total: newTotal,
    }
  }, [formatData])

  const handlePeriodChange = async (newPeriod: EstimatePeriod) => {
    onPeriodChange(newPeriod)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig?.ui,
        test_plan_estimate_everywhere_period: newPeriod,
      },
    })
  }

  useEffect(() => {
    onPeriodChange(userConfig?.ui?.test_plan_estimate_everywhere_period ?? DEFAULT_ESTIMATE_PERIOD)
  }, [testPlan?.id])

  return (
    <div className={styles.pieWrapper} id="test-plan-pie-estimates-wrapper">
      <div className={styles.pieHeader}>
        <h3 className={styles.graphsTitle}>{t("Tests Estimates")}</h3>
        <TestPlanPieEstimatesFilters setPeriod={handlePeriodChange} value={period} />
      </div>
      {isLoading && (
        <Flex align="center" justify="center" style={{ height: "100%" }}>
          <Spin size="large" />
        </Flex>
      )}
      {!isLoading && (
        <Flex vertical style={{ width: "100%" }}>
          <Flex gap={32} justify="space-between" style={{ width: "100%" }}>
            <Flex align="center" justify="center" style={{ margin: "0 auto" }}>
              <ResponsiveContainer
                width={200}
                height={height}
                ref={chartRef}
                id="test-plan-pie-estimates-container"
              >
                <PieChart>
                  <Pie
                    data={formatData}
                    dataKey="estimates"
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
                  </Pie>
                  <Tooltip wrapperClassName="recharts-tooltip" formatter={tooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
            </Flex>
            <Flex style={{ paddingTop: 16, paddingBottom: 16 }}>
              <StatisticLegend
                data={formatData}
                renderStatus={legendFormatter}
                testid="test-plan-pie-estimates"
              />
            </Flex>
          </Flex>
          <div
            className={styles.notEstimatedBlock}
            data-testid="test-plan-pie-estimates-not-estimated-block"
          >
            <span>
              {t("Not estimated tests statistics")}:{" "}
              {`${estimatesStats.empty}/${estimatesStats.total}`}
            </span>
          </div>
        </Flex>
      )}
    </div>
  )
}
