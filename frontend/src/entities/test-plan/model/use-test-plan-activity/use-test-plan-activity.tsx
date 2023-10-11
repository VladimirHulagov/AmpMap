import { TableProps } from "antd"
import { TablePaginationConfig } from "antd/es/table"
import { ColumnsType } from "antd/lib/table"
import { FilterValue } from "antd/lib/table/interface"
import moment from "moment"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { useLazyGetTestPlanActivityQuery } from "entities/test-plan/api"
import { filterActionFormat, filterStatusFormat } from "entities/test-plan/lib"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { useTableSearch } from "shared/hooks"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { Status } from "shared/ui"
import { HighLighterTesty } from "shared/ui"

import { useTestPlanActivityBreadcrumbs } from "./index"

interface TableParams {
  pagination?: TablePaginationConfig
  filters?: Record<string, FilterValue>
  sorter?: string
  search?: string
}

const initialTableParams: TableParams = {
  pagination: {
    current: 1,
    pageSize: 10,
    pageSizeOptions: ["10", "100", "200", "500", "1000"],
    showLessItems: true,
  },
}

export const useTestPlanActivity = () => {
  const { testPlanId, projectId } = useParams<ParamTestPlanId & ParamProjectId>()
  const [getActivity, { data, isLoading }] = useLazyGetTestPlanActivityQuery()
  const { getColumnSearch, setSearchText, setSearchedColumn, searchText, searchedColumn } =
    useTableSearch()
  const { renderBreadCrumbs } = useTestPlanActivityBreadcrumbs()
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({})
  const [tableParams, setTableParams] = useState<TableParams>(initialTableParams)

  const columns: ColumnsType<TestPlanActivityResult> = [
    {
      title: "Time",
      dataIndex: "action_timestamp",
      key: "action_timestamp",
      width: "100px",
      sorter: (a, b) => moment(a.action_timestamp).diff(b.action_timestamp),
      render: (value) => moment(value).format("HH:MM:ss"),
    },
    {
      title: "Test",
      dataIndex: "test_name",
      key: "test_name",
      ...getColumnSearch("test_name"),
      render: (text: string, record) =>
        searchedColumn.some((i) => i === "test_name") ? (
          <Link to={`/projects/${projectId}/plans/${record.breadcrumbs.id}?test=${record.test_id}`}>
            <HighLighterTesty searchWords={searchText} textToHighlight={text} />
          </Link>
        ) : (
          <Link to={`/projects/${projectId}/plans/${record.breadcrumbs.id}?test=${record.test_id}`}>
            {text}
          </Link>
        ),
      onFilter: (value, record) =>
        record.test_name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Test Plans",
      dataIndex: "breadcrumbs",
      key: "breadcrumbs",
      width: "500px",
      render: (value) => renderBreadCrumbs(value),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: "150px",
      filters: [
        {
          value: "added",
          text: "added",
        },
        {
          value: "deleted",
          text: "deleted",
        },
        {
          value: "updated",
          text: "updated",
        },
      ],
      onFilter: (value, record) => record.action.includes(String(value)),
    },
    {
      title: "Status",
      dataIndex: "status_text",
      key: "status_text",
      width: "150px",
      filters: [
        {
          value: "Failed",
          text: "Failed",
        },
        {
          value: "Passed",
          text: "Passed",
        },
        {
          value: "Skipped",
          text: "Skipped",
        },
        {
          value: "Broken",
          text: "Broken",
        },
        {
          value: "Blocked",
          text: "Blocked",
        },
        {
          value: "Retest",
          text: "Retest",
        },
        {
          value: "Untested",
          text: "Untested",
        },
      ],
      render: (last_status) => <Status value={last_status ? last_status : "Untested"} />,
      onFilter: (value, record) => record.status_text.includes(String(value)),
    },
    {
      title: "User",
      dataIndex: "username",
      key: "username",
      width: "240px",
      ...getColumnSearch("username"),
      onFilter: (value, record) =>
        record.username.toLowerCase().includes(String(value).toLowerCase()),
      render: (_, record) => {
        return (
          <div style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 8 }}>
            <UserAvatar size={32} avatar_link={record.avatar_link} />
            {record.username}
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    setSearchedColumn(["user", "test_name"])
  }, [])

  useEffect(() => {
    if (!testPlanId) return

    const requestData = {
      testPlanId,
      page_size: tableParams.pagination?.pageSize,
      page: tableParams.pagination?.current,
      status: tableParams.filters?.status_text
        ? filterStatusFormat((tableParams.filters.status_text as string[]) || [])
        : undefined,
      history_type: tableParams.filters?.action
        ? filterActionFormat((tableParams.filters.action as string[]) || [])
        : undefined,
      search: tableParams.search ? tableParams.search : undefined,
      ordering: tableParams.sorter ? tableParams.sorter : undefined,
    }

    getActivity(requestData)
  }, [testPlanId, searchText, JSON.stringify(tableParams)])

  const handlePaginationChange = (page: number, pageSize: number) => {
    if (!testPlanId) return
    setTableParams((prevState) => ({
      ...prevState,
      pagination: {
        ...prevState.pagination,
        pageSize,
        current: page,
      },
    }))
  }

  const handleSearch = (value: string) => {
    if (!testPlanId) return
    setTableParams((prevState) => ({
      ...prevState,
      search: value,
    }))
    setSearchText(value)
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
  }

  const handleTableChange: TableProps<TestPlanActivityResult>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter
  ) => {
    const sortTesty = antdSorterToTestySort(sorter, "plans")

    setTableParams((prevState) => ({
      ...prevState,
      pagination,
      filters: filters as Record<string, FilterValue>,
      sorter: sortTesty,
    }))
    setFilteredInfo(filters)
  }

  const clearFilters = () => {
    setFilteredInfo({})
    setTableParams((prevState) => ({
      ...initialTableParams,
      sorter: prevState.sorter,
    }))
    setSearchText("")
  }

  return {
    data,
    isLoading,
    columns,
    searchText,
    filteredInfo,
    handlePaginationChange,
    handleSearch,
    handleSearchChange,
    handleTableChange,
    clearFilters,
  }
}
