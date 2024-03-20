import { LeftOutlined } from "@ant-design/icons"
import { Button, TablePaginationConfig, TableProps, Tag } from "antd"
import type { FilterValue } from "antd/es/table/interface"
import { ColumnsType } from "antd/lib/table"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetTestCasesQuery, useLazyGetTestCaseByIdQuery } from "entities/test-case/api"

import { useUserConfig } from "entities/user/model"

import { colors } from "shared/config"
import { useTableSearch } from "shared/hooks"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { HighLighterTesty } from "shared/ui"

import { selectDrawerTestCase, setDrawerTestCase } from "../../../entities/test-case/model"

export const useTestCasesTable = () => {
  const dispatch = useAppDispatch()
  const { testSuiteId, projectId } = useParams<ParamTestSuiteId & ParamProjectId>()
  const { searchText, setSearchText, getColumnSearch } = useTableSearch()
  const selectedTestCase = useAppSelector(selectDrawerTestCase)
  const [ordering, setOrdering] = useState<string | undefined>(undefined)
  const { userConfig, updateConfig } = useUserConfig()
  const [isShowArchive, setIsShowArchive] = useState(userConfig.test_cases.is_show_archived)

  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const [searchParams, setSearchParams] = useSearchParams()
  const [paginationParams, setPaginationParams] = useState({
    page: 1,
    pageSize: 10,
  })

  const { data: testCases, isLoading } = useGetTestCasesQuery(
    {
      suite: testSuiteId ?? "",
      project: projectId ?? "",
      search: searchText,
      ordering,
      page: paginationParams.page,
      page_size: paginationParams.pageSize,
      is_archive: isShowArchive,
    },
    { skip: !projectId }
  )
  const [getTestCase] = useLazyGetTestCaseByIdQuery()

  const handleChange: TableProps<TestCase>["onChange"] = (
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

  const showTestCaseDetail = (testCase: TestCase) => {
    dispatch(setDrawerTestCase(testCase))
  }

  const hideTestCaseDetail = () => {
    dispatch(setDrawerTestCase(null))
  }

  const handleRowClick = (testCaseRow: TestCase) => {
    const testCaseIdQuery = searchParams.get("test_case")
    if (!testCaseIdQuery) {
      setSearchParams({ test_case: String(testCaseRow.id) })
      showTestCaseDetail(testCaseRow)
    } else if (testCaseIdQuery && testCaseRow.id === selectedTestCase?.id) {
      searchParams.delete("test_case")
      setSearchParams(searchParams)
      hideTestCaseDetail()
    } else {
      setSearchParams({ test_case: String(testCaseRow.id) })
      showTestCaseDetail(testCaseRow)
    }
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPaginationParams({ page, pageSize })
  }

  const handleShowArchived = async () => {
    setIsShowArchive(!isShowArchive)
    await updateConfig({
      test_cases: { is_show_archived: !userConfig.test_cases.is_show_archived },
    })
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

  useEffect(() => {
    if (!searchParams.get("test_case") || selectedTestCase) return
    const fetchTestCase = async () => {
      const testCaseId = searchParams.get("test_case")
      const testCase = await getTestCase({ testCaseId: testCaseId ?? "" }).unwrap()
      showTestCaseDetail(testCase)
    }
    fetchTestCase()
  }, [searchParams.get("test_case"), selectedTestCase])

  const columns: ColumnsType<TestCase> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: "70px",
      sorter: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      ...getColumnSearch("name"),
      onFilter: (value, record) => record.name.toLowerCase().includes(String(value).toLowerCase()),
      render: (text, record) => (
        <Link
          id={record.name}
          to={`/projects/${record.project}/suites/${record.suite}?test_case=${record.id}`}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
          <HighLighterTesty searchWords={searchText} textToHighlight={text} />
        </Link>
      ),
    },
    {
      key: "archived",
      width: "100px",
      align: "right",
      render: (_, record) => {
        return record.is_archive ? <Tag color={colors.error}>Archived</Tag> : null
      },
    },
    {
      key: "action",
      width: "50px",
      align: "right",
      render: (_, record) => {
        const isCurrent = selectedTestCase?.id === record.id
        return (
          <Button
            size={"middle"}
            type={"text"}
            onClick={() => (isCurrent ? hideTestCaseDetail : showTestCaseDetail(record))}
          >
            <LeftOutlined style={{ transform: `rotate(${isCurrent ? 0 : 180}deg)` }} />
          </Button>
        )
      },
    },
  ]

  return {
    columns,
    isShowArchive,
    isLoading,
    selectedTestCase,
    testCases,
    filteredInfo,
    searchText,
    paginationTable: { ...paginationTable, total: testCases?.count ?? 0 },
    getColumnSearch,
    handleChange,
    clearAll,
    handleRowClick,
    hideTestCaseDetail,
    handleShowArchived,
    showTestCaseDetail,
  }
}
