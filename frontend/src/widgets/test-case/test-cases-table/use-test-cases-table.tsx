import { LeftOutlined } from "@ant-design/icons"
import { Button, TablePaginationConfig, Tag } from "antd"
import type { FilterValue } from "antd/es/table/interface"
import { ColumnsType } from "antd/lib/table"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetTestCasesQuery, useLazyGetTestCaseByIdQuery } from "entities/test-case/api"
import { selectDrawerTestCase, setDrawerTestCase } from "entities/test-case/model"

import { useUserConfig } from "entities/user/model"

import { colors, config } from "shared/config"
import { useAntdTable, useTableSearch } from "shared/hooks"
import { HighLighterTesty } from "shared/ui"

export const useTestCasesTable = () => {
  const { testSuiteId, projectId } = useParams<ParamTestSuiteId & ParamProjectId>()
  const dispatch = useAppDispatch()
  const { userConfig, updateConfig } = useUserConfig()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isShowArchive, setIsShowArchive] = useState<boolean>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    searchParams.get("show_archived")
      ? JSON.parse(searchParams.get("show_archived") ?? "")
      : userConfig.test_cases.is_show_archived
  )

  const [isRefreshingTable, setIsRefreshingTable] = useState(false)

  const searchTestCase = searchParams.get("test_case")

  const showTestCaseDetail = (testCase: TestCase) => {
    handleAddTableParam("test_case", testCase.id.toString())
    dispatch(setDrawerTestCase(testCase))
  }

  const onRowClick = (testCaseRow: TestCase) => {
    if (!searchTestCase) {
      searchParams.set("test_case", String(testCaseRow.id))
      setSearchParams(searchParams)
      showTestCaseDetail(testCaseRow)
    } else if (searchTestCase && testCaseRow.id === selectedTestCase?.id) {
      searchParams.delete("test_case")
      setSearchParams(searchParams)
      hideTestCaseDetail()
    } else {
      searchParams.set("test_case", String(testCaseRow.id))
      setSearchParams({ test_case: String(testCaseRow.id) })
      showTestCaseDetail(testCaseRow)
    }
  }

  const {
    data,
    tableParams,
    total,
    isLoading,
    handleChange,
    handleRowClick,
    handleClearAll,
    handleDeleteTableParam,
    handleAddTableParam,
  } = useAntdTable<TestCase>({
    key: "test-cases-table",
    // @ts-ignore
    getData: useGetTestCasesQuery,
    onRowClick,
    requestParams: {
      suite: testSuiteId,
      project: projectId,
      is_archive: isShowArchive,
    },
    requestOptions: {
      skip: !projectId,
    },
    filtersMapping: (filters) => ({
      name: filters?.name ? (filters?.name[0] as string) : undefined,
    }),
    hasSearch: false,
  })

  const { searchText, onClear: onSearchClear, getColumnSearch } = useTableSearch()
  const selectedTestCase = useAppSelector(selectDrawerTestCase)

  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const [getTestCase] = useLazyGetTestCaseByIdQuery()

  const clearAll = async () => {
    await handleChangeShowArchive(false)
    setFilteredInfo({})
    onSearchClear()
    handleClearAll()

    //dirty fix to refresh table filters
    setIsRefreshingTable(true)
    setTimeout(() => {
      setIsRefreshingTable(false)
    }, 0)
  }

  const hideTestCaseDetail = () => {
    handleDeleteTableParam(["test_case", "version"])
    dispatch(setDrawerTestCase(null))
  }

  const handleChangeShowArchive = async (value: boolean) => {
    setIsShowArchive(value)
    await updateConfig({
      test_cases: { is_show_archived: value },
    })
    const urlParams = Object.fromEntries([...searchParams])
    setSearchParams({
      ...urlParams,
      show_archived: String(value),
    })
  }

  const handleShowArchived = async () => {
    await handleChangeShowArchive(!isShowArchive)
  }

  const paginationTable: TablePaginationConfig = useMemo(() => {
    return {
      hideOnSinglePage: false,
      pageSizeOptions: config.pageSizeOptions,
      showLessItems: true,
      showSizeChanger: true,
      current: tableParams.page,
      pageSize: tableParams.page_size,
      total,
    }
  }, [tableParams, total])

  useEffect(() => {
    if (!searchTestCase || selectedTestCase) return
    const fetchTestCase = async () => {
      const testCase = await getTestCase({ testCaseId: searchTestCase ?? "" }).unwrap()
      showTestCaseDetail(testCase)
    }
    fetchTestCase()
  }, [searchTestCase, selectedTestCase])

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
    testCases: data,
    filteredInfo,
    searchText,
    paginationTable,
    getColumnSearch,
    handleChange,
    clearAll,
    handleRowClick,
    hideTestCaseDetail,
    handleShowArchived,
    showTestCaseDetail,
    isRefreshingTable,
  }
}
