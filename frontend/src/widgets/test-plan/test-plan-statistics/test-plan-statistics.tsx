import { Flex } from "antd"
import { useMeContext } from "processes"
import { memo, useRef, useState } from "react"

import { useAppSelector } from "app/hooks"

import { selectFilter } from "entities/test/model"

import { useGetTestPlanStatisticsQuery } from "entities/test-plan/api"

import { useProjectContext } from "pages/project"

import { DEFAULT_ESTIMATE_PERIOD, NOT_ASSIGNED_FILTER_VALUE } from "shared/constants"

import styles from "./styles.module.css"
import { TestPlanChildStatistic } from "./test-plan-child-statistic/test-plan-child-statistic"
import { TestPlanHistogram } from "./test-plan-histogram/test-plan-histogram"
import { TestPlanPieCount } from "./test-plan-pie-count"
import { TestPlanPieEstimates } from "./test-plan-pie-estimates/test-plan-pie-estimates"

interface Props {
  testPlanId?: number
  segment: GraphBaseType
}

export const TestPlanStatistics = memo(({ testPlanId, segment }: Props) => {
  const project = useProjectContext()
  const testsFilter = useAppSelector(selectFilter)
  const graphsRef = useRef<HTMLDivElement>(null)
  const { userConfig } = useMeContext()

  const [pieHeight, setPieHeight] = useState(208)
  const [period, setPeriod] = useState<EstimatePeriod>(
    userConfig?.ui?.test_plan_estimate_everywhere_period ?? DEFAULT_ESTIMATE_PERIOD
  )

  const handlePieHeightChange = (height: number) => {
    if (height > pieHeight) {
      setPieHeight(height)
    }
  }

  const { data = [], isFetching } = useGetTestPlanStatisticsQuery(
    {
      project: project.id,
      estimate_period: period,
      parent: testPlanId ? Number(testPlanId) : null,
      labels: testsFilter.labels?.length ? testsFilter.labels : undefined,
      not_labels: testsFilter.not_labels?.length ? testsFilter.not_labels : undefined,
      labels_condition: testsFilter.labels_condition ?? undefined,
      is_archive: testsFilter.is_archive,
      plan: testsFilter.plans,
      suite: testsFilter.suites,
      assignee: testsFilter.assignee.filter((assignee) => assignee !== NOT_ASSIGNED_FILTER_VALUE),
      unassigned: testsFilter.assignee.includes(NOT_ASSIGNED_FILTER_VALUE) ? true : undefined,
      last_status: testsFilter.statuses,
      search: testsFilter.name_or_id,
      test_plan_started_after: testsFilter.test_plan_started_after,
      test_plan_started_before: testsFilter.test_plan_started_before,
      test_plan_created_after: testsFilter.test_plan_created_after,
      test_plan_created_before: testsFilter.test_plan_created_before,
      test_created_after: testsFilter.test_created_after,
      test_created_before: testsFilter.test_created_before,
    },
    { skip: segment !== "pie" }
  )

  return (
    <div style={{ marginBottom: 8 }}>
      <div className={styles.graphsBlock} ref={graphsRef}>
        {segment === "pie" && (
          <Flex gap={32} wrap="wrap" style={{ width: "100%" }}>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <TestPlanPieCount
                data={data}
                isLoading={isFetching}
                onHeightChange={handlePieHeightChange}
                height={pieHeight}
              />
            </div>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <TestPlanPieEstimates
                data={data}
                isLoading={isFetching}
                onHeightChange={handlePieHeightChange}
                height={pieHeight}
                period={period}
                onPeriodChange={setPeriod}
              />
            </div>
          </Flex>
        )}
        {segment === "bar" && <TestPlanHistogram testPlanId={testPlanId} />}
        {segment === "child" && <TestPlanChildStatistic />}
      </div>
    </div>
  )
})

TestPlanStatistics.displayName = "TestPlanStatistics"
