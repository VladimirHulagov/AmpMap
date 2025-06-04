import { useMeContext } from "processes"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { selectFilter } from "entities/test/model"

import {
  useGetTestPlanChildStatisticsQuery,
  useLazyGetTestPlansQuery,
} from "entities/test-plan/api"

import { NOT_ASSIGNED_FILTER_VALUE } from "shared/constants"
import { useDebounce } from "shared/hooks"
import { LazyNodeProps, TreeNodeUpdate } from "shared/libs/tree"

interface UseTestPlanStatisticsProps {
  testPlanId: number | undefined
  view: EntityView
}

export const useTestPlanStatistics = ({ testPlanId, view }: UseTestPlanStatisticsProps) => {
  const [visibleTests, setVisibleTests] = useState<
    { id: number; title: string; isRoot: boolean }[]
  >([])
  const debouncedVisibleTests = useDebounce(visibleTests, 1000)
  const [childStatistics, setChildStatistics] = useState<Record<string, ChildStatisticData>>({})
  const { projectId } = useParams<ParamProjectId>()
  const testsFilter = useAppSelector(selectFilter)
  const [getTestPlans, { isLoading: isLoadingGetTestPlans }] = useLazyGetTestPlansQuery()
  const { userConfig } = useMeContext()
  const period: EstimatePeriod = userConfig?.ui?.test_plan_estimate_everywhere_period ?? "minutes"

  const onUpdate = (data: TreeNodeUpdate<Test | TestPlan, LazyNodeProps>[]) => {
    if (view !== "tree") {
      return
    }

    const finalData = data
      .filter(({ props }) => !props.isLeaf)
      .map(({ data: nodeData, props }) => ({
        id: nodeData.id,
        title: nodeData.title,
        isRoot: props.level === 0,
      }))
    setVisibleTests(finalData)
  }

  useEffect(() => {
    if (view === "tree") {
      return
    }

    const getChildTestPlans = async () => {
      const response = await getTestPlans({
        project: Number(projectId),
        parent: testPlanId ?? null,
      }).unwrap()

      const childTestPlans = response.results.map((testPlan) => ({
        id: testPlan.id,
        title: testPlan.title,
        isRoot: true,
      }))

      setVisibleTests(childTestPlans)
    }

    getChildTestPlans()
  }, [view, testPlanId])

  const { data, isLoading: isLoadingChildStatistics } = useGetTestPlanChildStatisticsQuery(
    {
      parent: null,
      project: Number(projectId),
      plan_ids: debouncedVisibleTests.map((test) => test.id),
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
    { skip: !projectId || !debouncedVisibleTests.length }
  )

  useEffect(() => {
    if (isLoadingChildStatistics) {
      setChildStatistics({})
    }
  }, [isLoadingChildStatistics])

  useEffect(() => {
    if (isLoadingChildStatistics || !data) {
      return
    }

    const result: Record<string, ChildStatisticData> = {}
    visibleTests.forEach((test, index) => {
      const { id, title } = test
      const statistics = data[id]
      if (!statistics) {
        return
      }

      const totalValue = statistics.reduce((acc, curr) => acc + curr.value, 0)
      const totalNotUntested = statistics.reduce(
        (acc, curr) => acc + (curr.id === null ? 0 : curr.value),
        0
      )

      const convertEstimatesFromMinutesToPeriod = (estimates: number) => {
        if (!estimates) {
          return 0
        }
        if (period === "hours") {
          return Number((estimates / 60).toFixed(2))
        }
        if (period === "days") {
          return Number((estimates / 60 / 24).toFixed(2))
        }
        return estimates
      }

      const totalEstimates = statistics.reduce((acc, curr) => acc + curr.estimates, 0)
      const totalEstimatesNotUntested = statistics.reduce(
        (acc, curr) => acc + (curr.id === null ? 0 : curr.estimates),
        0
      )

      result[id] = {
        statistics: statistics.map((stat) => ({
          ...stat,
          estimates: convertEstimatesFromMinutesToPeriod(stat.estimates),
        })),
        id,
        title,
        total: {
          count: {
            all: totalValue,
            notUntested: totalNotUntested,
          },
          estimates: {
            all: convertEstimatesFromMinutesToPeriod(totalEstimates),
            notUntested: convertEstimatesFromMinutesToPeriod(totalEstimatesNotUntested),
          },
        },
        order: index,
        isRoot: test.isRoot,
      }
    })
    setChildStatistics(result)
  }, [
    data,
    isLoadingChildStatistics,
    visibleTests,
    userConfig?.ui?.test_plan_estimate_everywhere_period,
  ])

  return {
    childStatistics,
    isLoading: isLoadingChildStatistics || isLoadingGetTestPlans,
    onUpdate,
  }
}
