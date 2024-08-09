import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import React, { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useGetTestSuitesTreeViewQuery } from "entities/suite/api"

import { config } from "shared/config"
import { useAntdTable } from "shared/hooks"
import { HighLighterTesty } from "shared/ui"

interface UseTestSuiteTableProps {
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
  activeSuite?: Suite
}

export const useTestSuiteTable = ({ activeSuite, setCollapse }: UseTestSuiteTableProps) => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const navigate = useNavigate()
  const [isInvalidList, setIsInvalidList] = useState(false)

  const {
    data,
    tableParams,
    total,
    isLoading,
    expandedRowKeys,
    searchText,
    handleChange,
    handleRowClick,
    handleRowExpand,
    handleSearch,
    refetch,
  } = useAntdTable<SuiteTree>({
    key: `test-suite-table-${activeSuite?.id}`,
    // @ts-ignore
    getData: useGetTestSuitesTreeViewQuery,
    onRowClick: ({ id }) => navigate(`/projects/${projectId}/suites/${id}`),
    requestParams: {
      project: projectId,
      parent: activeSuite ? String(activeSuite?.id) : undefined,
    },
    isSyncParams: !activeSuite,
  })

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

  const onSearchFieldClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
  }

  const onCollapseChange = (key: string | string[]) => {
    if (!Array.isArray(key)) return
    setCollapse((prevState) => !prevState)
  }

  const paginationTable: TablePaginationConfig = {
    hideOnSinglePage: false,
    pageSizeOptions: config.pageSizeOptions,
    showLessItems: true,
    showSizeChanger: true,
    current: tableParams.page,
    pageSize: tableParams.page_size,
    total,
  }

  useEffect(() => {
    if (isInvalidList) {
      refetch()
    }
  }, [isInvalidList])

  return {
    paginationTable,
    columns,
    expandedRowKeys,
    treeSuites: data,
    total,
    isLoading,
    testSuiteId,
    searchText,
    onCollapseChange,
    onSearchFieldClick,
    onRowExpand: handleRowExpand,
    onSearch: handleSearch,
    handleRowClick,
    handleChange,
    invalidateList: () => setIsInvalidList(true),
  }
}
