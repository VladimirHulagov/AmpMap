import { BarChartOutlined, ClockCircleOutlined, PieChartOutlined } from "@ant-design/icons"
import { Row, Segmented } from "antd"
import { SegmentedValue } from "antd/lib/segmented"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

import { useAppSelector } from "app/hooks"

import { useLabels } from "entities/label/model"

import { useTestsTableParams } from "entities/test/model"

import { useGetTestPlanHistogramQuery, useGetTestPlanStatisticsQuery } from "entities/test-plan/api"
import { selectArchivedTestsIsShow } from "entities/test-plan/model"

import { useUserConfig } from "entities/user/model"

import { TestPlanHistogram } from "./test-plan-histogram/test-plan-histogram"
import { TestPlanHistogramFilters } from "./test-plan-histogram/test-plan-histogram-filters"
import { TestPlanPieCount } from "./test-plan-pie-count"
import { TestPlanPieEstimates } from "./test-plan-pie-estimates/test-plan-pie-estimates"
import { TestPlanPieEstimatesFilters } from "./test-plan-pie-estimates/test-plan-pie-estimates-filters"

interface TestPlanStatisticsProps {
  testPlanId: string
}

const DEFAULT_ESTIMATE: EstimatePeriod = "minutes"

export const TestPlanStatistics = ({ testPlanId }: TestPlanStatisticsProps) => {
  const is_archive = useAppSelector(selectArchivedTestsIsShow)
  const { updateConfig, userConfig } = useUserConfig()
  const { selectedLabels, selectedNotlabels, labelsConditionFilter } = useLabels()
  const [period, setPeriod] = useState<EstimatePeriod>(
    userConfig.ui?.test_plan_estimate_everywhere_period || DEFAULT_ESTIMATE
  )

  useEffect(() => {
    setPeriod(userConfig.ui?.test_plan_estimate_everywhere_period ?? DEFAULT_ESTIMATE)
  }, [testPlanId])

  const { data: pieData } = useGetTestPlanStatisticsQuery({
    testPlanId,
    labels: selectedLabels.length ? selectedLabels : undefined,
    not_labels: selectedNotlabels.length ? selectedNotlabels : undefined,
    labels_condition: labelsConditionFilter ?? undefined,
    estimate_period: period,
    is_archive,
  })

  const { tableParams, setTableParams } = useTestsTableParams()
  const [segment, setSegment] = useState<SegmentedValue>(userConfig.ui?.graph_base_type || "pie")
  const [barType, setBarType] = useState<SegmentedValue>(
    userConfig.ui?.graph_base_bar_type || "by_time"
  )
  const [dateHistogram, setDateHistogram] = useState({
    start: userConfig.ui?.test_plan?.[testPlanId]?.start_date
      ? dayjs(userConfig.ui?.test_plan?.[testPlanId]?.start_date)
      : dayjs().subtract(6, "days"),
    end: userConfig.ui?.test_plan?.[testPlanId]?.end_date
      ? dayjs(userConfig.ui?.test_plan?.[testPlanId]?.end_date)
      : dayjs(),
  })
  const [attribute, setAttribute] = useState(userConfig.ui.graph_base_bar_attribute_input ?? "")

  const { data: histogramData } = useGetTestPlanHistogramQuery(
    {
      testPlanId,
      start_date: dateHistogram.start.format("YYYY-MM-DD"),
      end_date: dateHistogram.end.format("YYYY-MM-DD"),
      attribute: barType === "by_attr" ? attribute : undefined,
      labels: selectedLabels.length ? selectedLabels : undefined,
      not_labels: selectedNotlabels.length ? selectedNotlabels : undefined,
      labels_condition: labelsConditionFilter ?? undefined,
      is_archive,
    },
    {
      skip: segment === "pie",
    }
  )

  const handleSegmentedChange = async (value: SegmentedValue) => {
    setSegment(value)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig.ui,
        graph_base_type: value,
      },
    })
  }

  const handlePeriodChange = async (period: EstimatePeriod) => {
    setPeriod(period)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig.ui,
        test_plan_estimate_everywhere_period: period,
      },
    })
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Row style={{ marginBottom: 16, maxWidth: 800, paddingRight: 40 }}>
        <Segmented
          id="test-plan-statistic-tabs"
          options={[
            {
              value: "pie",
              icon: <PieChartOutlined />,
            },
            {
              value: "pie_estimate",
              icon: <ClockCircleOutlined />,
            },
            {
              value: "bar",
              icon: <BarChartOutlined />,
            },
          ]}
          onChange={handleSegmentedChange}
          size="large"
          defaultValue={segment}
          value={segment}
        />
        {segment === "bar" && (
          <TestPlanHistogramFilters
            barType={barType}
            testPlanId={testPlanId}
            setAttribute={setAttribute}
            dateHistogram={dateHistogram}
            setDateHistogram={setDateHistogram}
            setBarType={setBarType}
          />
        )}
        {segment === "pie_estimate" && (
          <TestPlanPieEstimatesFilters setPeriod={handlePeriodChange} value={period} />
        )}
      </Row>
      <Row gutter={20}>
        <div style={{ height: 400, display: "flex", width: 800 }}>
          {segment === "pie" && (
            <TestPlanPieCount
              data={pieData ?? []}
              tableParams={tableParams}
              setTableParams={setTableParams}
            />
          )}
          {segment === "pie_estimate" && (
            <TestPlanPieEstimates
              data={pieData ?? []}
              tableParams={tableParams}
              setTableParams={setTableParams}
              period={period}
            />
          )}
          {segment === "bar" && <TestPlanHistogram data={histogramData ?? []} />}
        </div>
      </Row>
    </div>
  )
}
