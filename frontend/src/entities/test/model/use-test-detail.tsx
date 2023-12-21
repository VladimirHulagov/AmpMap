import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetProjectQuery } from "entities/project/api"

import { useGetTestCaseByIdQuery } from "entities/test-case/api"

import { selectArchivedResultsIsShow, showArchivedResults } from "entities/test-plan/model"

import { setTest } from "./slice"

type TabTypes = "results" | "comments"

export const useTestDetail = (test: Test | null) => {
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<TabTypes>("results")
  const [commentOrdering, setCommentOrdering] = useState<"asc" | "desc">("desc")
  const { projectId } = useParams<ParamProjectId>()

  const { data: testCase, isLoading: isLoadingTestCase } = useGetTestCaseByIdQuery(
    { testCaseId: String(test?.case) },
    {
      skip: !test,
    }
  )
  const { data: project, isLoading: isLoadingProject } = useGetProjectQuery(Number(projectId), {
    skip: !projectId,
  })
  const showArchive = useAppSelector(selectArchivedResultsIsShow)
  const [searchParams, setSearchParams] = useSearchParams()

  const handleShowArchived = () => {
    dispatch(showArchivedResults())
  }

  const handleCloseDetails = () => {
    searchParams.delete("test")
    setSearchParams(searchParams)
    dispatch(setTest(null))
  }

  const handleTabChange = (activeKey: string) => {
    setTab(activeKey as TabTypes)
  }

  const handleCommentOrderingClick = () => {
    setCommentOrdering(commentOrdering === "asc" ? "desc" : "asc")
  }

  return {
    testCase,
    isLoadingTestCase,
    project,
    isLoadingProject,
    showArchive,
    commentOrdering,
    tab,
    handleShowArchived,
    handleCloseDetails,
    handleTabChange,
    handleCommentOrderingClick,
  }
}
