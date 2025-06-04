import { Flex, Spin } from "antd"
import { SegmentedValue } from "antd/es/segmented"
import dayjs from "dayjs"
import { useMeContext } from "processes"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useAppSelector } from "app/hooks"

import { selectFilter } from "entities/test/model"

import { useGetTestPlanHistogramQuery } from "entities/test-plan/api"

import { NOT_ASSIGNED_FILTER_VALUE } from "shared/constants"

import styles from "../styles.module.css"
import { TestPlanHistogramFilters } from "./test-plan-histogram-filters"

type ValuesData = "passed" | "failed" | "skipped" | "broken" | "blocked" | "retest"

interface Props {
  testPlanId?: number
}

const dataEmpty = [
  {
    point: "No results",
    blocked: 0,
    broken: 0,
    failed: 0,
    passed: 0,
    retest: 0,
    skipped: 0,
  },
]
type TestPlanHistogramBarData = { point: string } & Record<string, number>

const convertData = (data: TestPlanHistogramData[]): TestPlanHistogramBarData[] => {
  const newResult = [] as TestPlanHistogramBarData[]
  data.forEach((item) => {
    const resultItem = {} as TestPlanHistogramBarData
    Object.entries(item).forEach(([key, value]) => {
      if (key !== "point") {
        const v = value as TestPlanHistogramDataPoint
        resultItem[v.label] = v.count
      } else {
        const v = value as string
        resultItem.point = v
      }
    })
    newResult.push(resultItem)
  })

  return newResult
}

const createStatuses = (data: TestPlanHistogramData[]): { name: string; color: string }[] => {
  const result = {} as Record<string, string>
  data.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== "point") {
        const v = value as TestPlanHistogramDataPoint
        result[v.label.toLocaleLowerCase()] = v.color
      }
    })
  })

  return Object.entries(result).map(([name, color]) => ({ name, color }))
}

export const TestPlanHistogram = ({ testPlanId }: Props) => {
  const { t } = useTranslation()
  const { projectId } = useParams<ParamProjectId>()
  const testsFilter = useAppSelector(selectFilter)
  const { userConfig } = useMeContext()

  const [barType, setBarType] = useState<SegmentedValue>(
    userConfig?.ui?.graph_base_bar_type ?? "by_time"
  )
  const testPlanIdConfigKey = testPlanId ?? "root"
  const [dateHistogram, setDateHistogram] = useState({
    start: userConfig?.ui?.test_plan?.[testPlanIdConfigKey]?.start_date
      ? dayjs(userConfig?.ui?.test_plan?.[testPlanIdConfigKey]?.start_date)
      : dayjs().subtract(6, "days"),
    end: userConfig?.ui?.test_plan?.[testPlanIdConfigKey]?.end_date
      ? dayjs(userConfig?.ui?.test_plan?.[testPlanIdConfigKey]?.end_date)
      : dayjs(),
  })
  const [attribute, setAttribute] = useState(userConfig?.ui?.graph_base_bar_attribute_input ?? "")
  const { data: histogramData, isFetching } = useGetTestPlanHistogramQuery({
    project: Number(projectId),
    parent: testPlanId ? Number(testPlanId) : null,
    start_date: dateHistogram.start.format("YYYY-MM-DD"),
    end_date: dateHistogram.end.format("YYYY-MM-DD"),
    attribute: barType === "by_attr" ? attribute : undefined,
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
  })

  const legendFormatter = (
    value: Uppercase<ValuesData>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entry: any,
    index: number
  ) => {
    return (
      <span
        style={{ color: "var(--y-color-text-secondary)" }}
        key={index}
        data-testid={`test-plan-histogram-legend-${value}`}
      >
        {value}
      </span>
    )
  }

  const getPrettyInterval = () => {
    const dataLen = histogramData?.length ?? 1
    const len = Math.floor(dataLen / 8)
    return dataLen <= 10 ? 0 : len
  }

  const interval = getPrettyInterval()
  const convertedData = convertData(histogramData ?? [])
  const statuses = createStatuses(histogramData ?? [])

  return (
    <div className={styles.barWrapper}>
      <div className={styles.pieHeader}>
        <h3 className={styles.graphsTitle}>{t("Tests Count Histogram")}</h3>
        <TestPlanHistogramFilters
          barType={barType}
          testPlanId={testPlanId}
          setAttribute={setAttribute}
          dateHistogram={dateHistogram}
          setDateHistogram={setDateHistogram}
          setBarType={setBarType}
        />
      </div>
      {isFetching && (
        <Flex align="center" justify="center" style={{ height: "100%" }}>
          <Spin size="large" />
        </Flex>
      )}
      {!isFetching && (
        <ResponsiveContainer width="100%" id="test-plan-histogram-container">
          <BarChart
            width={800}
            height={280}
            data={convertedData.length ? convertedData : dataEmpty}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="point"
              type="category"
              interval={interval}
              stroke="var(--y-color-text-secondary)"
            />
            <YAxis stroke="var(--y-color-text-secondary)" />
            <Tooltip
              wrapperClassName="recharts-tooltip"
              cursor={{ fill: "var(--y-color-control-background-hover)" }}
            />
            {statuses.map((status) => (
              <Bar
                dataKey={status.name}
                stackId="a"
                fill={status.color}
                barSize={40}
                name={status.name.toUpperCase()}
                values={status.name}
                key={status.name}
              />
            ))}
            <Legend formatter={legendFormatter} iconType="square" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
