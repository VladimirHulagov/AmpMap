import { useEffect, useState } from "react"
import { useLocation, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetRelatedEntitiesQuery } from "entities/test/api"
import { useGetTestQuery } from "entities/test/api"

import { useGetTestCaseByIdQuery } from "entities/test-case/api"

import {
  selectArchivedResultsIsShow,
  selectTests,
  showArchivedResults,
} from "entities/test-plan/model"

import { useCacheState } from "shared/hooks"
import { antdModalCloseConfirm } from "shared/libs/antd-modals"

import { selectDrawerData, selectDrawerTest, setDrawerTest, setDrawerView } from "./slice"

type TabTypes = "result" | "comment" | "all"

export const useTestDetail = () => {
  const dispatch = useAppDispatch()
  const [tab, setTab] = useCacheState<TabTypes>("test-detail-tab", "all")
  const [ordering, setOrdering] = useCacheState<Ordering>("test-detail-entities-ordering", "desc")
  const tests = useAppSelector(selectTests)
  const drawerData = useAppSelector(selectDrawerData)
  const drawerTest = useAppSelector(selectDrawerTest)
  const showArchive = useAppSelector(selectArchivedResultsIsShow)
  const [selectedResult, setSelectedResult] = useState<Result>()
  const [isDirty, setIsDirty] = useState(false)

  const [testCaseData, setTestCaseData] = useState<TestCase | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const testId = searchParams.get("test")

  const location = useLocation()

  const {
    data,
    isSuccess: isSuccessList,
    isFetching: isFetchingList,
  } = useGetRelatedEntitiesQuery(
    {
      test_id: Number(drawerTest?.id),
      ordering: ordering === "asc" ? "created_at" : "-created_at",
    },
    { skip: !drawerTest?.id }
  )

  useEffect(() => {
    if (location.hash && isSuccessList) {
      const element = document.getElementById(location.hash.substring(1))
      element?.scrollIntoView({ behavior: "smooth" })
    }
  }, [location, isSuccessList])

  const { data: testCase, isFetching: isFetchingTestCase } = useGetTestCaseByIdQuery(
    { testCaseId: String(drawerTest?.case) },
    {
      skip: !drawerTest,
    }
  )

  const { data: testData, isFetching: isFetchingTest } = useGetTestQuery(testId ?? "", {
    skip: !testId || !!drawerTest,
  })

  const handleShowArchived = () => {
    dispatch(showArchivedResults())
  }

  const closeDetails = () => {
    searchParams.delete("test")
    setSearchParams(searchParams)
    dispatch(setDrawerTest(null))
    dispatch(setDrawerView({ view: "test", shouldClose: false }))
  }

  const handleCloseDetails = () => {
    if (isDirty) {
      antdModalCloseConfirm(closeDetails)
      return
    }

    closeDetails()
  }

  const handleTabChange = (activeKey: string) => {
    setTab(activeKey as TabTypes)
  }

  const handleOrderingClick = () => {
    setOrdering(ordering === "asc" ? "desc" : "asc")
  }

  const handleEditCloneClick = (result: Result, isClone: boolean) => {
    setSelectedResult(result)
    dispatch(setDrawerView({ view: isClone ? "cloneResult" : "editResult" }))
  }

  const handleAddResultClick = () => {
    dispatch(setDrawerView({ view: "addResult" }))
  }

  const handleCancelAction = () => {
    if (drawerData.shouldClose) {
      closeDetails()
      return
    }

    dispatch(setDrawerView({ view: "test" }))
  }

  useEffect(() => {
    const selectedCase = tests.find((t) => t.case === testCase?.id)

    if (selectedCase && testCase) {
      const updated = {
        ...testCase,
        test_suite_description: selectedCase.test_suite_description,
      }
      setTestCaseData(updated)
      return
    }
    setTestCaseData(testCase ?? null)
  }, [testCase, tests])

  useEffect(() => {
    if (!testData || !testId || !!drawerTest) {
      return
    }

    dispatch(setDrawerTest(testData))
  }, [testData, testId, drawerTest])

  useEffect(() => {
    return () => {
      dispatch(setDrawerTest(null))
    }
  }, [])

  const results = data?.results.filter(({ type }) => type === "result") ?? []

  return {
    drawerTest,
    testCase: testCaseData,
    isFetching: isFetchingTestCase || isFetchingTest,
    showArchive,
    ordering,
    tab,
    results: results as Result[],
    all: data?.results ?? [],
    count: data?.count ?? 0,
    isFetchingList,
    drawerView: drawerData.view,
    handleShowArchived,
    handleCloseDetails,
    handleTabChange,
    handleOrderingClick,
    handleCancelAction,
    handleAddResultClick,
    handleEditCloneClick,
    selectedResult,
    setIsDirty,
  }
}
