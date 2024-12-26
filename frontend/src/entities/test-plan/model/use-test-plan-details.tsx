import { MeContext } from "processes"
import { useContext } from "react"
import { useParams } from "react-router-dom"

import { useGetTestPlanQuery } from "entities/test-plan/api"

import { useCacheState } from "shared/hooks"

type EntityView = "list" | "tree"

export const useTestPlanDetails = () => {
  const { userConfig } = useContext(MeContext)!
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const [dataView, setDataView] = useCacheState<EntityView>("test-plan-detail-tests-view", "tree")

  const {
    data: testPlan,
    isFetching,
    refetch,
  } = useGetTestPlanQuery(
    {
      testPlanId: testPlanId ?? "",
      is_archive: userConfig.test_plans?.is_show_archived,
      project: Number(projectId),
      parent: null,
    },
    {
      skip: !testPlanId || !projectId,
    }
  )

  return {
    isLoading: isFetching,
    testPlanId,
    testPlan: testPlanId ? testPlan : undefined,
    dataView,
    setDataView,
    refetch,
  }
}
