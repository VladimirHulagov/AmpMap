import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import React, { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useGetTestSuitesTreeViewQuery } from "entities/suite/api"

import { TreeUtils } from "shared/libs"
import { addKeyToData } from "shared/libs/add-key-to-data"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { HighLighterTesty } from "shared/ui"

interface UseTestSuiteTableProps {
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
  activeSuite?: Suite
}

export const useTestSuiteTable = ({ activeSuite, setCollapse }: UseTestSuiteTableProps) => {
  const navigate = useNavigate()
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [searchText, setSearchText] = useState("")
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [paginationParams, setPaginationParams] = useState({
    page: 1,
    pageSize: 10,
  })
  const [ordering, setOrdering] = useState<string | undefined>(undefined)
  const [treeData, setTreeData] = useState<Suite[]>([])
  const [total, setTotal] = useState(0)
  const { data: testSuitesTreeView, isLoading: isTreeLoading } = useGetTestSuitesTreeViewQuery({
    search: searchText,
    project: projectId,
    ordering,
    page: paginationParams.page,
    page_size: paginationParams.pageSize,
    parent: activeSuite ? String(activeSuite?.id) : undefined,
  })

  useEffect(() => {
    if (!testSuitesTreeView) return

    setTreeData(testSuitesTreeView.results)
    setTotal(testSuitesTreeView.count)
  }, [testSuitesTreeView])

  useEffect(() => {
    if (!testSuitesTreeView || !searchText.length) return
    const initDataWithKeys = addKeyToData(testSuitesTreeView.results)
    const [, expandedRows] = TreeUtils.filterRows<DataWithKey<TestPlanTreeView>>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      JSON.parse(JSON.stringify(initDataWithKeys)),
      searchText,
      {
        isAllExpand: true,
        isShowChildren: false,
      }
    )

    setExpandedRowKeys(expandedRows.map((key) => String(key)))
  }, [testSuitesTreeView, searchText])

  const columns: ColumnsType<Suite> = [
    {
      title: "Test Suite",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (text, record) => (
        <Link id={record.name} to={`/projects/${projectId}/suites/${record.id}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
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
      key: "total_cases_count",
      dataIndex: "total_cases_count",
      sorter: true,
      render: (text, record) => (
        <span
          style={{
            display: "block",
            textAlign: "center",
          }}
        >
          {record.cases_count} ({record.total_cases_count})
        </span>
      ),
    },
    {
      width: 150,
      title: "Estimate",
      key: "total_estimates",
      dataIndex: "total_estimates",
      sorter: true,
      render: (text, record) => (
        <span
          style={{
            display: "block",
            textAlign: "center",
          }}
        >
          {record.estimates ? `${record.estimates} (${record.total_estimates})` : "-"}
        </span>
      ),
    },
  ]

  const onSearch = (searchText: string) => {
    setSearchText(searchText.trim())

    if (!searchText.trim().length) {
      setExpandedRowKeys([])
      return
    }
  }

  const onRowExpand = (expandedRows: string[], recordKey: string) => {
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

  const handleRowClick = ({ id }: Suite) => {
    navigate(`/projects/${projectId}/suites/${id}`)
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPaginationParams({ page, pageSize })
  }

  const handleSorter = (sorter: SorterResult<Suite> | SorterResult<Suite>[]) => {
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
    total,
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
    treeSuites: treeData,
    total,
    isLoading: isTreeLoading,
    testSuiteId,
    searchText,
  }
}
