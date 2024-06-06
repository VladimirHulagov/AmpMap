import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetSuiteQuery } from "entities/suite/api"
import { selectTestSuite, setTestSuite } from "entities/suite/model/slice"

export const useTestSuiteDetails = () => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const testSuite = useAppSelector(selectTestSuite)
  const {
    data: suite,
    isLoading,
    isSuccess,
    refetch,
  } = useGetSuiteQuery(Number(testSuiteId), { skip: !testSuiteId })

  const dispatch = useAppDispatch()
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

  const descriptionLines = useMemo(() => {
    return suite?.description.split(/\r\n|\r|\n/) ?? []
  }, [suite])

  const shortDesc = useMemo(() => {
    const text = descriptionLines.slice(0, 3).join("\n")
    if (descriptionLines.length > 3 || text.length > 300) return `${text.slice(0, 300)}...`
    return text
  }, [descriptionLines])

  return {
    shortDesc,
    suite,
    isLoading,
    isShowMore,
    descriptionLines,
    projectId,
    handleShowMoreClick,
    handleRefetch: refetch,
  }
}
