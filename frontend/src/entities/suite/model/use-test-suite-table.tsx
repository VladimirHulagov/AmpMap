import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import React, { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useLazyGetTestSuitesTreeViewQuery } from "entities/suite/api"

import { TreeUtils, initInternalError } from "shared/libs"
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
  const [treeData, setTreeData] = useState<SuiteTree[]>([])
  const [total, setTotal] = useState(0)
  const [getTestSuitesTreeView] = useLazyGetTestSuitesTreeViewQuery()
  const [isLoading, setIsLoading] = useState(false)
  const [isInvalidList, setIsInvalidList] = useState(false)
  const timer = React.useRef<number>()
  const isSearchTextChange = React.useRef(false)

  const fetchTestSuitesTreeView = async () => {
    try {
      isSearchTextChange.current = false

      setIsLoading(true)
      const result = await getTestSuitesTreeView({
        search: searchText,
        project: projectId,
        ordering,
        page: paginationParams.page,
        page_size: paginationParams.pageSize,
        parent: activeSuite ? String(activeSuite?.id) : undefined,
        _cacheInvalidation: isInvalidList ? Date.now() : undefined,
      })

      if (!result.data) return

      setTreeData(result.data.results)
      setTotal(result.data.count)
      setIsInvalidList(false)
    } catch (error) {
      initInternalError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isInvalidList) {
      fetchTestSuitesTreeView()
    }
  }, [isInvalidList])

  useEffect(() => {
    fetchTestSuitesTreeView()
  }, [projectId, activeSuite])

  useEffect(() => {
    if (!isSearchTextChange.current) {
      fetchTestSuitesTreeView()
    }
  }, [projectId, paginationParams, activeSuite])

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current)
    }

    isSearchTextChange.current = true

    setPaginationParams({
      ...paginationParams,
      page: 1,
    })

    timer.current = window.setTimeout(() => {
      fetchTestSuitesTreeView()
    }, 300)

    return () => {
      clearTimeout(timer.current)
    }
  }, [searchText])

  useEffect(() => {
    if (!treeData || !searchText.length) return
    const initDataWithKeys = addKeyToData(treeData)
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
  }, [treeData, searchText])

  const columns: ColumnsType<SuiteTree> = [
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

  const handleSorter = (sorter: SorterResult<SuiteTree> | SorterResult<SuiteTree>[]) => {
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
    isLoading,
    testSuiteId,
    searchText,
    invalidateList: () => setIsInvalidList(true),
  }
}
