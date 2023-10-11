import { useMemo } from "react"

import { useTestsTableParams } from "entities/test/model"

export const useLabels = () => {
  const { tableParams, setTableParams } = useTestsTableParams()

  const handleLableClick = (labelId: string) => {
    const labelsList = tableParams.filters?.labels || []
    const isAlreadyId = labelsList.some((i) => i === labelId)

    if (labelsList.length === 1 && isAlreadyId) {
      reset()
      return
    }

    const newLabelsList = isAlreadyId
      ? labelsList.filter((i) => i !== labelId)
      : [...labelsList, labelId]

    setTableParams({
      filters: {
        labels: newLabelsList,
      },
    })
  }

  const handleConditionClick = () => {
    const conditionStr = tableParams.filters?.labels_condition

    setTableParams({
      filters: {
        labels_condition: conditionStr === "and" ? "or" : "and",
      },
    })
  }

  const reset = () => {
    setTableParams({
      filters: {
        labels: [],
      },
    })
  }

  const toggleCondition = useMemo(() => {
    const conditionStr = tableParams.filters?.labels_condition
    if (conditionStr === null) return true

    return conditionStr !== "and"
  }, [tableParams])

  return {
    labelsFilter: tableParams.filters?.labels || [],
    labelsConditionFilter: tableParams.filters?.labels_condition,
    toggleCondition,
    handleLableClick,
    handleConditionClick,
    reset,
  }
}
