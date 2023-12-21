import { useMemo } from "react"
import { useParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useTestsTableParams } from "entities/test/model"

import { useGetTestPlanLabelsQuery } from "entities/test-plan/api"

import { selectSelectedLabels, setSelectedLabels } from "./slice"

export const useLabels = (options?: { testPlanId?: string }) => {
  const dispatch = useAppDispatch()
  const { testPlanId: testPlanIdParam } = useParams<ParamTestPlanId>()
  const { data: labels, isLoading } = useGetTestPlanLabelsQuery(
    options?.testPlanId ?? testPlanIdParam ?? "",
    {
      skip: !options?.testPlanId && !testPlanIdParam,
    }
  )
  const { tableParams, setTableParams } = useTestsTableParams()
  const selectedLabels = useAppSelector(selectSelectedLabels)

  const handleLableClick = (labelId: string) => {
    const findLabel = selectedLabels.labels.find((i) => i === labelId)
    const findNotLabel = selectedLabels.not_labels.find((i) => i === labelId)

    if (!findLabel && !findNotLabel) {
      dispatch(
        setSelectedLabels({ ...selectedLabels, labels: [...selectedLabels.labels, labelId] })
      )
      return
    }

    if (findLabel) {
      dispatch(
        setSelectedLabels({
          labels: selectedLabels.labels.filter((i) => i !== labelId),
          not_labels: [...selectedLabels.not_labels, labelId],
        })
      )
      return
    }

    if (findNotLabel) {
      dispatch(
        setSelectedLabels({
          labels: selectedLabels.labels.filter((i) => i !== labelId),
          not_labels: selectedLabels.not_labels.filter((i) => i !== labelId),
        })
      )
      return
    }
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
        not_labels: [],
      },
    })
    dispatch(
      setSelectedLabels({
        labels: [],
        not_labels: [],
      })
    )
  }

  const toggleCondition = useMemo(() => {
    const conditionStr = tableParams.filters?.labels_condition
    if (conditionStr === null) return true

    return conditionStr !== "and"
  }, [tableParams])

  return {
    selectedLabels: selectedLabels.labels,
    selectedNotlabels: selectedLabels.not_labels,
    labelsConditionFilter: tableParams.filters?.labels_condition,
    toggleCondition,
    labels,
    isLoading,
    handleLableClick,
    handleConditionClick,
    reset,
  }
}
