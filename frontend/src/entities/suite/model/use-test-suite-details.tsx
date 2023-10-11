import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetSuiteQuery } from "entities/suite/api"
import { selectTestSuite, setTestSuite } from "entities/suite/model/slice"

export const useTestSuiteDetails = () => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [searchParams] = useSearchParams()
  const testSuite = useAppSelector(selectTestSuite)
  const {
    data: suite,
    isLoading,
    isSuccess,
    refetch,
  } = useGetSuiteQuery({
    suiteId: testSuiteId || "",
    treeview: true,
  })

  const dispatch = useAppDispatch()
  const [testCaseId, setTestCaseId] = useState<number | null>(null)
  const [isShowMore, setIsShowMore] = useState(false)

  const handleShowMoreClick = () => {
    setIsShowMore((prevState) => !prevState)
  }

  useEffect(() => {
    if (!testSuite) return
    refetch()
  }, [testSuite])

  useEffect(() => {
    if (!isSuccess) return
    dispatch(setTestSuite(suite))
  }, [suite])

  useEffect(() => {
    const testCase = searchParams.get("test_case")

    if (!testCase) {
      setTestCaseId(null)
      return
    }

    setTestCaseId(Number(testCase))
  }, [searchParams.get("test_case")])

  const descriptionLines = useMemo(() => {
    return suite?.description.split(/\r\n|\r|\n/) || []
  }, [suite])

  const shortDesc = useMemo(() => {
    const text = descriptionLines.slice(0, 3).join("\n")
    if (descriptionLines.length > 3 || text.length > 300) return `${text.slice(0, 300)}...`
    return text
  }, [descriptionLines])

  return {
    shortDesc,
    testCaseId,
    suite,
    isLoading,
    isShowMore,
    descriptionLines,
    projectId,
    setTestCaseId,
    handleShowMoreClick,
    handleRefetch: refetch,
  }
}
