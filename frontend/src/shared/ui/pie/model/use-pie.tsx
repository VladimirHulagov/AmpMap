import { useCallback, useMemo } from "react"

import { colors } from "shared/config"
import { getStatusNumberByTextAndUndefinedNull } from "shared/libs"

const getColorByStatus = (status: string) => {
  switch (status) {
    case "UNTESTED":
      return colors.broken
    case "PASSED":
      return colors.success
    case "FAILED":
      return colors.error
    case "RETEST":
      return colors.warning
    case "SKIPPED":
      return colors.skipped
    case "BROKEN":
      return colors.broken
    case "BLOCKED":
      return colors.bloked

    default:
      return colors.broken
  }
}

interface UsePieProps {
  data: ITestPlanStatistics[]
  tableParams: TestTableParams
  setTableParams: (params: TestTableParams) => void
}

export const usePie = ({ data, tableParams, setTableParams }: UsePieProps) => {
  const getNewLastStatuses = (label: string) => {
    const status = getStatusNumberByTextAndUndefinedNull(label)
    const oldStatuses = tableParams.filters?.last_status || []
    const isIncluded = oldStatuses.includes(status)
    const isOne = oldStatuses.length === 1

    if (isIncluded) {
      return isOne ? [] : oldStatuses.filter((i) => i !== status)
    }

    return [...oldStatuses, status]
  }

  const isAllZero = useMemo(() => {
    return !data.some((item) => item.value > 0)
  }, [data])

  const total = useMemo(() => {
    if (isAllZero) return 0
    return data.reduce((acc, cur) => acc + cur.value, 0)
  }, [data, isAllZero])

  const formatData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      fill: getColorByStatus(item.label),
      value: isAllZero ? 1 : item.value,
    }))
  }, [data, isAllZero])

  const legendFormatter = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any, entry: any) => {
      const label = String(entry.payload.label)
      const payloadValue = entry.payload?.value
      const percent = entry.payload?.percent
      const lastStatuses = getNewLastStatuses(label)
      const isActive = checkActive(label)

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
            {label} [0] (0%)
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
            {label} [{payloadValue || 0}] (0%)
          </span>
        )
      }

      return (
        <span
          style={{ cursor: "pointer", borderBottom: isActive ? `1px solid ${colors.accent}` : "0" }}
          onClick={handleClick}
        >
          {value} [{payloadValue || 0}] ({(percent * 100).toFixed(2)}%)
        </span>
      )
    },
    [isAllZero, tableParams]
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
    const status = getStatusNumberByTextAndUndefinedNull(label)
    return tableParams.filters?.last_status?.some((i) => String(i) === status) || false
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
