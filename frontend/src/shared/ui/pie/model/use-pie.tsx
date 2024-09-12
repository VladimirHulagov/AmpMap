import { useStatuses } from "entities/status/model/use-statuses"
import { useCallback, useMemo } from "react"
import { useParams } from "react-router-dom"

import { colors } from "shared/config"

interface UsePieProps {
  data: TestPlanStatistics[]
  tableParams: TestTableParams
  setTableParams: (params: TestTableParams) => void
  type: "value" | "estimates"
  period?: EstimatePeriod
}

export const usePie = ({ data, tableParams, setTableParams, type, period }: UsePieProps) => {
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const { getStatusNumberByText, isLoading } = useStatuses({ project: projectId, plan: testPlanId })
  const getNewLastStatuses = (label: string) => {
    if (isLoading) {
      return []
    }
    const status = getStatusNumberByText(label)
    const oldStatuses = tableParams.filters?.last_status ?? []
    const isIncluded = status === null ? false : oldStatuses.includes(status)
    const isOne = oldStatuses.length === 1

    if (isIncluded) {
      return isOne ? [] : oldStatuses.filter((i) => i !== status)
    }

    return [...oldStatuses, status].filter(Boolean) as string[]
  }

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

  // TODO need refactoring
  const legendFormatter = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any, entry: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const label = String(entry.payload.label)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const payloadValue = entry.payload[type]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const percent = entry.payload?.percent
      const lastStatuses = getNewLastStatuses(label)
      const isActive = checkActive(label)
      const estimateValue = type === "estimates" ? period?.slice(0, 1) ?? "m" : ""

      const handleClick = () => {
        setTableParams({
          filters: {
            last_status: lastStatuses,
          },
        })
      }

      if (isAllZero) {
        return (
          <span
            style={{
              cursor: "pointer",
              borderBottom: isActive ? `1px solid ${colors.accent}` : "0",
            }}
            onClick={handleClick}
          >
            {label} [0{estimateValue}] (0%)
          </span>
        )
      }

      if (payloadValue === 0) {
        return (
          <span
            style={{
              cursor: "pointer",
              borderBottom: isActive ? `1px solid ${colors.accent}` : "0",
            }}
            onClick={handleClick}
          >
            {label} [{payloadValue ?? 0}
            {estimateValue}] (0%)
          </span>
        )
      }

      return (
        <span
          style={{ cursor: "pointer", borderBottom: isActive ? `1px solid ${colors.accent}` : "0" }}
          onClick={handleClick}
        >
          {value} [{payloadValue ?? 0}
          {estimateValue}] ({(percent * 100).toFixed(2)}%)
        </span>
      )
    },
    [isAllZero, tableParams, period, getStatusNumberByText]
  )

  const tooltipFormatter = useCallback(
    (value: number) => {
      if (isAllZero) return 0
      return value
    },
    [isAllZero]
  )

  const handleCellClick = (entry: { fill: string; value: number; label: string }) => {
    const lastStatuses = getNewLastStatuses(entry.label)
    setTableParams({
      filters: {
        last_status: lastStatuses,
      },
    })
  }

  const checkActive = (label: string) => {
    const status = getStatusNumberByText(label)
    return tableParams.filters?.last_status?.some((i) => i === status) ?? false
  }

  return {
    formatData,
    total,
    legendFormatter,
    tooltipFormatter,
    handleCellClick,
    checkActive,
  }
}
