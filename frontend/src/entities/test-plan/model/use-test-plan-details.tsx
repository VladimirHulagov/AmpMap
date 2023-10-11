import { useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useLazyGetTestQuery } from "entities/test/api"
import { selectTest, setTest } from "entities/test/model"

import { useGetTestPlanTreeViewQuery } from "entities/test-plan/api"

import { useUserConfig } from "entities/user/model"

export const useTestPlanDetails = () => {
  const dispatch = useAppDispatch()
  const test = useAppSelector(selectTest)
  const { userConfig } = useUserConfig()
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const { data: testPlan, isLoading } = useGetTestPlanTreeViewQuery({
    testPlanId: testPlanId || "",
    is_archive: userConfig.test_plans.is_show_archived,
  })
  const [getTest] = useLazyGetTestQuery()

  const [searchParams] = useSearchParams()

  useEffect(() => {
    const testUrl = searchParams.get("test")

    if (!testUrl) {
      dispatch(setTest(null))
      return
    }

    if (!testUrl || test) return
    getTest(testUrl)
  }, [searchParams.get("test")])

  useEffect(() => {
    return () => {
      dispatch(setTest(null))
    }
  }, [])

  return {
    isLoading,
    testPlanId,
    testPlan,
    test,
    projectId,
    setTest,
  }
}
