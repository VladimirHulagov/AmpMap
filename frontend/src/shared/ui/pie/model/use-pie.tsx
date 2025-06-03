import { useStatuses } from "entities/status/model/use-statuses"
import { StatusStatisticLegend } from "entities/status/ui"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useParams } from "react-router-dom"

import styles from "./styles.module.css"

interface UsePieProps {
  data: TestPlanStatistics[]
  type: "value" | "estimates"
  statuses: string[]
  period?: EstimatePeriod
  onHeightChange?: (height: number) => void
}

// this shared component is designed for one statistic, or it should be changed to be multifunctional, or moved to a widget or entity
export const usePie = ({ data, statuses, type, period, onHeightChange }: UsePieProps) => {
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const { getStatusNumberByText, isLoading } = useStatuses({ project: projectId, plan: testPlanId })
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => {
      if (!chartRef.current || !onHeightChange) {
        return
      }
      const legend = chartRef.current.querySelector(
        ".recharts-default-legend"
      ) as unknown as HTMLElement | null
      if (legend) {
        onHeightChange(legend.clientHeight + 50)
      }
    }, 0)
  }, [data])

  const isAllZero = useMemo(() => {
    return !data.some((item) => item[type] > 0)
  }, [data])

  const total = useMemo(() => {
    if (isAllZero) return 0
    return data.reduce((acc, cur) => acc + cur[type], 0)
  }, [data, isAllZero])

  const formatData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      fill: item.color,
      [type]: isAllZero ? 1 : item[type],
    }))
  }, [data, isAllZero, isLoading])

  const legendFormatter = useCallback(
    (value: TestPlanStatistics) => {
      const payloadValue = value[type]
      const percent = total > 0 ? ((value[type] / total) * 100).toFixed(2) : "0"
      const isActive = checkActive(value.label)
      const estimateValue = type === "estimates" ? (period?.slice(0, 1) ?? "m") : ""

      if (isAllZero) {
        return (
          <StatusStatisticLegend
            label={value.label}
            value={<span className={styles.legendValue}>[0{estimateValue}] (0%)</span>}
            color={value.color}
            isActive={isActive}
            data-testid={`pie-legend-title-${value.label}`}
          />
        )
      }

      if (payloadValue === 0) {
        return (
          <StatusStatisticLegend
            label={value.label}
            value={
              <span className={styles.legendValue}>
                [{payloadValue ?? 0}
                {estimateValue}] (0%)
              </span>
            }
            color={value.color}
            isActive={isActive}
            data-testid={`pie-legend-title-${value.label}`}
          />
        )
      }

      return (
        <StatusStatisticLegend
          label={value.label}
          value={
            <span className={styles.legendValue}>
              [{payloadValue ?? 0}
              {estimateValue}] ({percent}%)
            </span>
          }
          color={value.color}
          isActive={isActive}
          data-testid={`pie-legend-title-${value.label}`}
        />
      )
    },
    [isAllZero, period, total, getStatusNumberByText]
  )

  const tooltipFormatter = useCallback(
    (value: number) => {
      if (isAllZero) return 0
      return value
    },
    [isAllZero]
  )

  const checkActive = (label: string) => {
    const status = getStatusNumberByText(label)
    return statuses?.some((i) => String(i) === status) ?? false
  }

  return {
    formatData,
    total,
    legendFormatter,
    tooltipFormatter,
    chartRef,
  }
}
