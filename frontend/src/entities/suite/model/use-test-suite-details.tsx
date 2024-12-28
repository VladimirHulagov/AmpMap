import { useParams } from "react-router-dom"

import { useGetSuiteQuery } from "entities/suite/api"

import { useCacheState } from "shared/hooks"

type EntityView = "list" | "tree"

export const useTestSuiteDetails = () => {
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const [dataView, setDataView] = useCacheState<EntityView>(
    "test-suite-detail-tests-cases-view",
    "tree"
  )

  const {
    data: suite,
    isFetching,
    refetch,
  } = useGetSuiteQuery(Number(testSuiteId), { skip: !testSuiteId })

  return {
    testSuiteId,
    suite: testSuiteId ? suite : undefined,
    isLoading: isFetching,
    dataView,
    setDataView,
    refetch,
  }
}
