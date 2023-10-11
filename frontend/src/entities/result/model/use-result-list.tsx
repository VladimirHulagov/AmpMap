import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { useLazyGetResultsQuery } from "entities/result/api"

import { selectArchivedResultsIsShow } from "entities/test-plan/model"

export const useResultList = (testId: number) => {
  const [getResults, { data: results, isLoading }] = useLazyGetResultsQuery()
  const [isShowTestResultEditModal, setIsShowTestResultEditModal] = useState(false)
  const [testResultEdit, setTestResultEdit] = useState<IResult | null>(null)
  const showArchive = useAppSelector(selectArchivedResultsIsShow)
  const { projectId } = useParams<ParamProjectId>()

  useEffect(() => {
    getResults({ testId: String(testId), showArchive, project: projectId || "" })
  }, [testId, showArchive])

  return {
    results,
    isLoading,
    isShowTestResultEditModal,
    setIsShowTestResultEditModal,
    testResultEdit,
    setTestResultEdit,
  }
}
