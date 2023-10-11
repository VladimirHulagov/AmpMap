import { TablePaginationConfig, TableProps } from "antd"
import type { FilterValue } from "antd/es/table/interface"
import { useContext, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import {
  TestCaseIdContext,
  TestCaseIdContextType,
} from "entities/suite/ui/test-suite-detail/test-case-context"

import { useGetTestCasesQuery } from "entities/test-case/api"

import { useTableSearch } from "shared/hooks"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"

import { clearTestCase } from "./slice"

export const useTestCasesTable = () => {
  const { testCaseId, setTestCaseId } = useContext(TestCaseIdContext) as TestCaseIdContextType
  const { testSuiteId, projectId } = useParams<ParamTestSuiteId & ParamProjectId>()
  const { searchText, setSearchText, getColumnSearch } = useTableSearch()
  const [ordering, setOrdering] = useState<string | undefined>(undefined)

  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const [searchParams, setSearchParams] = useSearchParams()
  const [paginationParams, setPaginationParams] = useState({
    page: 1,
    pageSize: 10,
  })

  const { data: testCases, isLoading } = useGetTestCasesQuery({
    suite: testSuiteId || "",
    project: projectId || "",
    search: searchText,
    ordering,
    page: paginationParams.page,
    page_size: paginationParams.pageSize,
  })

  const handleChange: TableProps<ITestCase>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter
  ) => {
    setFilteredInfo(filters)
    const formatSorter = antdSorterToTestySort(sorter)
    setOrdering(formatSorter)
  }

  const clearAll = () => {
    setFilteredInfo({})
    setSearchText("")
  }

  const showTestCaseDetail = (testCaseId: Id) => {
    setTestCaseId(testCaseId)
  }

  const hideTestCaseDetail = () => {
    setTestCaseId(null)
  }

  const handleRowClick = ({ id }: ITestCase) => {
    const testCase = searchParams.get("test_case")
    if (!testCase) {
      setSearchParams({ test_case: String(id) })
      showTestCaseDetail(id)
    } else if (testCase && id === testCaseId) {
      searchParams.delete("test_case")
      clearTestCase()
      setSearchParams(searchParams)
      hideTestCaseDetail()
    } else {
      setSearchParams({ test_case: String(id) })
      showTestCaseDetail(id)
    }
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPaginationParams({ page, pageSize })
  }

  const paginationTable: TablePaginationConfig = useMemo(() => {
    return {
      hideOnSinglePage: false,
      pageSizeOptions: ["10", "20", "50", "100"],
      showLessItems: true,
      showSizeChanger: true,
      current: paginationParams.page,
      pageSize: paginationParams.pageSize,
      onChange: handlePaginationChange,
    }
  }, [testCases, paginationParams, searchParams.get("test_case")])

  return {
    isLoading,
    testCases,
    testCaseId,
    filteredInfo,
    searchText,
    paginationTable: { ...paginationTable, total: testCases?.count || 0 },
    getColumnSearch,
    handleChange,
    clearAll,
    handleRowClick,
    hideTestCaseDetail,
    showTestCaseDetail,
  }
}
