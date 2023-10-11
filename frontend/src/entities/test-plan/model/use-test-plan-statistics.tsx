import { useLabels } from "entities/label/model"

import { useGetTestPlanStatisticsQuery } from "../api"

export const useTestPlanStatistics = (testPlanId: string) => {
  const { labelsFilter, labelsConditionFilter } = useLabels()
  const { data, isLoading } = useGetTestPlanStatisticsQuery({
    testPlanId,
    labels: labelsFilter.length ? labelsFilter : undefined,
    labels_condition: labelsConditionFilter || undefined,
  })

  return {
    data,
    isLoading,
  }
}
