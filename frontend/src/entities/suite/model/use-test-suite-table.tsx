import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import React, { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useGetTestSuitesTreeViewQuery } from "entities/suite/api"

import { TreeUtils } from "shared/libs"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { HighLighterTesty } from "shared/ui"

interface UseTestSuiteTableProps {
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
  activeSuite?: ISuite
}

export const useTestSuiteTable = ({ setCollapse }: UseTestSuiteTableProps) => {
  const navigate = useNavigate()
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [searchText, setSearchText] = useState("")
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([])
  const [paginationParams, setPaginationParams] = useState({
    page: 1,
    pageSize: 10,
  })
  const [ordering, setOrdering] = useState<string | undefined>(undefined)

  const { data: treeSuites, isLoading: isLoadingTreeSuites } = useGetTestSuitesTreeViewQuery(
    {
      project: projectId || "",
      search: searchText,
      ordering,
      page: paginationParams.page,
      page_size: paginationParams.pageSize,
    },
    {
      skip: testSuiteId !== undefined,
    }
  )

  const { data: treeSuitesChild, isLoading: isLoadingChildTreeSuites } =
    useGetTestSuitesTreeViewQuery(
      {
        project: projectId || "",
        search: searchText,
        ordering,
        page: paginationParams.page,
        page_size: paginationParams.pageSize,
        parent: testSuiteId,
      },
      {
        skip: !testSuiteId,
      }
    )

  const columns: ColumnsType<ISuite> = [
    {
      title: "Test Suite",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (text, record) => (
        <Link to={`/projects/${projectId}/suites/${record.id}`}>
          <HighLighterTesty searchWords={searchText} textToHighlight={text} />
        </Link>
      ),
    },
    {
      width: 150,
      title: "Test Suites",
      key: "test-suites-count",
      dataIndex: "descendant_count",
      sorter: true,
      render: (text) => (
        <span
          style={{
            display: "block",
            textAlign: "center",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      width: 150,
      title: "Test Cases",
      key: "test-cases-count",
      dataIndex: "cases_count",
      sorter: true,
      render: (text, record) => (
        <span
          style={{
            display: "block",
            textAlign: "center",
          }}
        >
          {record.cases_count}
        </span>
      ),
    },
  ]

  const onSearch = (treeSuites: ISuite[], searchText: string) => {
    setPaginationParams({ page: 1, pageSize: 10 })
    setSearchText(searchText.trim())

    if (!searchText.trim().length) {
      setExpandedRowKeys([])
      return
    }

    const [, expandedRows] = TreeUtils.filterRows<ISuite>(treeSuites, searchText)

    setExpandedRowKeys(expandedRows as number[])
  }

  const onRowExpand = (expandedRows: number[], recordKey: number) => {
    if (expandedRows.includes(recordKey)) {
      setExpandedRowKeys(expandedRows.filter((key) => key !== recordKey))
    } else {
      setExpandedRowKeys([...expandedRows, recordKey])
    }
  }

  const onSearchFieldClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
  }

  const onCollapseChange = (key: string | string[]) => {
    if (!Array.isArray(key)) return
    setCollapse((prevState) => !prevState)
  }

  const handleRowClick = ({ id }: ISuite) => {
    navigate(`/projects/${projectId}/suites/${id}`)
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPaginationParams({ page, pageSize })
  }

  const handleSorter = (sorter: SorterResult<ISuite> | SorterResult<ISuite>[]) => {
    const formatSort = antdSorterToTestySort(sorter)
    setOrdering(formatSort || undefined)
  }

  const paginationTable: TablePaginationConfig = {
    hideOnSinglePage: false,
    pageSizeOptions: ["10", "20", "50", "100"],
    showLessItems: true,
    showSizeChanger: true,
    current: paginationParams.page,
    pageSize: paginationParams.pageSize,
    total: treeSuites?.count || 0,
    onChange: handlePaginationChange,
  }

  return {
    onCollapseChange,
    onSearchFieldClick,
    onRowExpand,
    onSearch,
    handleRowClick,
    handleSorter,
    paginationTable,
    columns,
    expandedRowKeys,
    treeSuites,
    treeSuitesChild,
    isLoading: isLoadingChildTreeSuites || isLoadingTreeSuites,
    testSuiteId,
    searchText,
  }
}
