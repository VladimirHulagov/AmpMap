import { LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Button, TablePaginationConfig } from "antd"
import { ColumnsType } from "antd/es/table"
import { FilterValue, Key, RowSelectMethod, SorterResult } from "antd/es/table/interface"
import decodeUriComponent from "decode-uri-component"
import { useStatuses } from "entities/status/model/use-statuses"
import queryString from "query-string"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectSelectedLabels, setSelectedLabels } from "entities/label/model"
import { Label } from "entities/label/ui"

import { useBulkUpdateMutation, useGetTestsQuery } from "entities/test/api"
import { selectTest, setTest, useTestsTableParams } from "entities/test/model"

import { selectArchivedTestsIsShow, setShowArchivedTests } from "entities/test-plan/model"

import { UserAvatar, UserUsername } from "entities/user/ui"

import { colors, config } from "shared/config"
import { useTableSearch } from "shared/hooks"
import { useUrlSyncParams } from "shared/hooks/use-url-sync-params"
import { sortEstimate } from "shared/libs"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { HighLighterTesty, Status } from "shared/ui"
import { ArchivedTag } from "shared/ui/archived-tag/archived-tag"
import { UntestedStatus } from "shared/ui/status"

import { AssigneeFiltersDrowdown } from "./filters/assignee-filters-dropdown"
import { SuiteFiltersDrowdown } from "./filters/suite-filters-dropdown"
import styles from "./styles.module.css"

interface TableParamsData extends Record<string, unknown> {
  page: number
  page_size: number
}

interface Props {
  testPlanId: Id
}

const formatOptions = {
  arrayFormat: "bracket-separator",
  arrayFormatSeparator: ",",
} as {
  arrayFormat: "bracket-separator"
  arrayFormatSeparator: ","
}
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

export const useTestsTable = ({ testPlanId }: Props) => {
  const { projectId } = useParams<ParamProjectId>()
  const dispatch = useAppDispatch()
  const selectedLabels = useAppSelector(selectSelectedLabels)
  const { setSearchText, getColumnSearch, searchText } = useTableSearch()

  const { statusesFiltersWithUntested } = useStatuses({ project: projectId, plan: testPlanId })

  const isShowArchiveState = useAppSelector(selectArchivedTestsIsShow)
  const [selectedSuites, setSelectedSuites] = useState<Key[]>([])
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])
  const {
    tableParams: testsTableParams,
    setTableParams: setTestsTableParams,
    reset,
  } = useTestsTableParams()
  const test = useAppSelector(selectTest)
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCompleteSelectLabels, setIsCompleteSelectLabels] = useState(false)
  const [isRefreshingTable, setIsRefreshingTable] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const isShowArchive: boolean = searchParams.get("is_archive")
    ? JSON.parse(searchParams.get("is_archive") ?? "")
    : isShowArchiveState
  const paramLabelsCondition = searchParams.get("labels_condition")
  const paramSuite = searchParams.get("suite[]")

  const [tableParams, setTableParams] = useState<TableParamsData>({
    page: searchParams.get("page") ? Number(searchParams.get("page")) : DEFAULT_PAGE,
    page_size: searchParams.get("page_size")
      ? Number(searchParams.get("page_size"))
      : DEFAULT_PAGE_SIZE,
  })

  useEffect(() => {
    setTableParams({
      page: DEFAULT_PAGE,
      page_size: DEFAULT_PAGE_SIZE,
    })
    setSearchText("")
  }, [selectedLabels])

  const tableParamsMemo = useMemo(() => {
    return {
      ...tableParams,
      labels: selectedLabels.labels,
      not_labels: selectedLabels.not_labels,
      labels_condition: testsTableParams.filters?.labels_condition,
      suite: selectedSuites,
    } as TableParamsData
  }, [tableParams, testsTableParams, selectedSuites])

  useEffect(() => {
    if (!testsTableParams.filters?.last_status) {
      return
    }
    changeTableParams({
      page: 1,
      page_size: tableParams.page_size,
      last_status: testsTableParams.filters.last_status,
    })
  }, [testsTableParams.filters?.last_status])

  useEffect(() => {
    if (isCompleteSelectLabels) {
      return
    }

    const format = queryString.parse(decodeUriComponent(searchParams.toString()), {
      arrayFormat: "bracket-separator",
      arrayFormatSeparator: ",",
    })

    if (format?.labels ?? format?.not_labels) {
      dispatch(
        setSelectedLabels({
          labels: (format?.labels as string[]) ?? [],
          not_labels: (format?.not_labels as string[]) ?? [],
        })
      )
    }
    setIsCompleteSelectLabels(true)
  }, [isCompleteSelectLabels, searchParams.get("labels"), searchParams.get("not_labels")])

  useEffect(() => {
    if (paramLabelsCondition) {
      setTestsTableParams({ filters: { labels_condition: paramLabelsCondition } })
    }
  }, [paramLabelsCondition])

  useEffect(() => {
    if (paramSuite) {
      const format = queryString.parse(decodeUriComponent(searchParams.toString()), formatOptions)
      setSelectedSuites(format?.suite as string[])
    }
  }, [paramSuite])

  useUrlSyncParams({ params: tableParamsMemo, setTableParams })

  const { data, isFetching } = useGetTestsQuery(
    {
      project: projectId ?? "",
      plan: testPlanId,
      is_archive: isShowArchive,
      nested_search: true,
      ...tableParamsMemo,
    },
    {
      skip: !projectId || !isCompleteSelectLabels,
    }
  )

  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [excludedRows, setExcludedRows] = useState<number[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [bulkUpdateTests] = useBulkUpdateMutation()

  useEffect(() => {
    if (isAllSelected && data?.results) {
      const newSelectedRows = data.results
        .map((test) => test.id)
        .filter((id) => !excludedRows.includes(id))
      setSelectedRows(newSelectedRows)
    }
  }, [data])

  const changeTableParams = (params: TableParamsData) => {
    const clearedSettings = JSON.parse(JSON.stringify(params)) as TableParamsData
    setTableParams(clearedSettings)
  }

  const handleAssignUserChange = (data?: SelectData) => {
    changeTableParams({
      ...tableParams,
      assignee: data ? String(data?.value) : undefined,
      unassigned: undefined,
    })
  }

  const handleUnAssignUser = () => {
    changeTableParams({
      ...tableParams,
      assignee: undefined,
      unassigned: true,
    })
  }

  const handleResetAssignee = () => {
    changeTableParams({
      ...tableParams,
      assignee: undefined,
      unassigned: undefined,
    })
  }

  const handleChangeShowArchive = (value: boolean, updatedTableParams?: TableParamsData) => {
    const newTableParams = updatedTableParams ?? tableParams
    changeTableParams({ ...newTableParams, is_archive: value })
    dispatch(setShowArchivedTests(value))
  }

  const handleShowArchived = () => {
    handleChangeShowArchive(!isShowArchive)
  }

  const handleClearAll = async () => {
    setSelectedSuites([])
    dispatch(
      setSelectedLabels({
        labels: [],
        not_labels: [],
      })
    )
    setTableParams({
      page: tableParams.page,
      page_size: tableParams.page_size,
    })
    reset()
    setSearchText("")
    handleChangeShowArchive(false, {
      page: tableParams.page,
      page_size: tableParams.page_size,
    })

    //dirty fix to refresh table filters
    setIsRefreshingTable(true)
    await Promise.resolve()
    setIsRefreshingTable(false)
  }

  const handleTableChange = <T extends unknown>(
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[]
  ) => {
    const ordering = antdSorterToTestySort(sorter)

    const settings: TableParamsData = {
      page: pagination.current ?? DEFAULT_PAGE,
      page_size: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
      ordering: ordering.length ? ordering : undefined,
      search: filters?.name ? (filters?.name[0] as string) : undefined,
      last_status: filters?.last_status ?? [],
      suite: tableParams?.suite,
      labels_condition: tableParams?.labels_condition,
      assignee: tableParams?.assignee,
      unassigned: tableParams?.unassigned,
    }

    changeTableParams(settings)
  }

  const handleRowClick = (testClick: Test) => {
    setSearchParams({ test: String(testClick.id) })
    dispatch(setTest(testClick))
  }

  const handleChangeVisibleColumns = (columns: string[]) => {
    setVisibleColumns(columns)
  }

  const handleSelectRows = (
    selectedRowKeys: Key[],
    selectedRows: Test[],
    info: {
      type: RowSelectMethod
    }
  ) => {
    setSelectedRows(selectedRowKeys as number[])

    if (info.type === "all") {
      const newIsAllSelected = !isAllSelected
      setIsAllSelected(newIsAllSelected)
      setExcludedRows([])
      if (!newIsAllSelected) {
        setSelectedRows([])
      } else {
        setSelectedRows(data?.results.map((test) => test.id) ?? [])
      }
    } else {
      if (isAllSelected) {
        //Exclude
        const notThisPageExcluded = excludedRows.filter(
          (id) => !data?.results.find((test) => test.id === id)
        )
        const currentPageExcluded =
          data?.results
            .filter((test) => !selectedRowKeys.includes(test.id))
            .map((test) => test.id) ?? []
        setExcludedRows([...notThisPageExcluded, ...currentPageExcluded])
      }
    }
  }

  const resetSelectedRows = () => {
    setExcludedRows([])
    setSelectedRows([])
    setIsAllSelected(false)
  }

  const handleChangeSuitesFilter = (keys: Key[]) => {
    setTableParams({
      page: DEFAULT_PAGE,
      page_size: DEFAULT_PAGE_SIZE,
    })
    setSelectedSuites(keys)
  }

  const columns: ColumnsType<Test> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: "70px",
      sorter: (a, b) => Number(a.id) - Number(b.id),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      ...getColumnSearch("name"),
      render: (text, record) => (
        <>
          {record.is_archive && <ArchivedTag />}
          <Link
            id={record.name}
            to={`/projects/${record.project}/plans/${record.plan}?test=${record.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
            <HighLighterTesty searchWords={searchText} textToHighlight={text} />
          </Link>
        </>
      ),
    },
    {
      title: "Test Suite",
      dataIndex: "suite_path",
      key: "suite_path",
      sorter: (a, b) => a.suite_path.localeCompare(b.suite_path),
      filterDropdown: ({ close }) =>
        SuiteFiltersDrowdown({
          selectedKeys: selectedSuites,
          setSelectedKeys: handleChangeSuitesFilter,
          close,
        }),
    },
    {
      title: "Estimate",
      dataIndex: "estimate",
      key: "estimate",
      width: "100px",
      sorter: (a, b) => sortEstimate(a.estimate, b.estimate),
    },
    {
      title: "Labels",
      dataIndex: "labels",
      key: "labels",
      render: (labels: Test["labels"]) => (
        <ul className={styles.list}>
          {labels.map((label) => (
            <li key={label.id}>
              <Label content={label.name} color={colors.accent} />
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "Last status",
      dataIndex: "last_status",
      key: "last_status",
      width: "150px",
      filters: statusesFiltersWithUntested,
      filteredValue: (tableParams.last_status as FilterValue) ?? undefined,
      render: (value, record) => {
        if (!value) {
          return <UntestedStatus />
        }
        return (
          <Status
            name={record.last_status_name}
            color={record.last_status_color}
            id={record.last_status}
          />
        )
      },
    },
    {
      title: "Assignee",
      dataIndex: "assignee_username",
      key: "assignee_username",
      sorter: true,
      filterDropdown: ({ close }) =>
        AssigneeFiltersDrowdown({
          close,
          onAssignUserChange: handleAssignUserChange,
          onUnAssignUserClick: handleUnAssignUser,
          onReset: handleResetAssignee,
        }),
      render: (_, record) => {
        if (!record.assignee_username) {
          return <span style={{ opacity: 0.7 }}>Nobody</span>
        }

        return (
          <div style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 8 }}>
            <UserAvatar size={32} avatar_link={record.avatar_link} />
            <UserUsername username={record.assignee_username} />
          </div>
        )
      },
    },
    {
      key: "action",
      width: "50px",
      align: "right",
      render: (_, record) => {
        return test?.id === record.id ? (
          <Button size={"middle"} type={"text"}>
            <LeftOutlined />
          </Button>
        ) : (
          <Button size={"middle"} type={"text"}>
            <RightOutlined />
          </Button>
        )
      },
    },
  ]

  const paginationTable: TablePaginationConfig = {
    hideOnSinglePage: false,
    pageSizeOptions: config.pageSizeOptions,
    showLessItems: true,
    showSizeChanger: true,
    current: tableParams.page,
    pageSize: tableParams.page_size,
    total: data?.count ?? 0,
  }

  const filteredColumns = columns.filter(
    (column) => column.key === "action" || visibleColumns.includes(column.title as string)
  )

  const afterBulkSubmit = () => {
    resetSelectedRows()
    handleClearAll()
  }

  const prepareBulkRequestData = () => {
    const commonFilters = {
      is_archive: tableParams.is_archived ?? isShowArchive,
      last_status: (tableParamsMemo.last_status as string[])?.join(","),
      search: tableParamsMemo.search,
      labels: tableParamsMemo.labels,
      not_labels: tableParamsMemo.not_labels,
      labels_condition: tableParamsMemo.labels_condition,
      suite: tableParamsMemo.suite,
      assignee: tableParamsMemo.assignee_id as string,
      unassigned: tableParamsMemo.unassigned,
    } as Partial<TestBulkUpdate>

    Object.keys(commonFilters).forEach((key) => {
      //@ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const v = commonFilters[key]
      if (Array.isArray(v)) {
        if (v.length) {
          const arr = v as string[]
          //@ts-ignore
          commonFilters[key] = arr.filter((t) => t !== "")
        }
        //@ts-ignore
        if ((commonFilters[key] as string[])?.length === 0) {
          //@ts-ignore
          delete commonFilters[key]
        }
      }
      if (v === undefined) {
        //@ts-ignore
        delete commonFilters[key]
      }
    })

    const reqData: TestBulkUpdate = {
      filter_conditions: commonFilters,
      included_tests: [] as number[],
      excluded_tests: [] as number[],
      current_plan: testPlanId,
    }
    if (isAllSelected) {
      reqData.excluded_tests = excludedRows
    } else {
      reqData.included_tests = selectedRows
    }

    return reqData
  }

  const handleBulkAssignSubmit = async (assignee: string | null) => {
    const reqData = prepareBulkRequestData()
    reqData.assignee = assignee ?? ""

    handleClearAll()
    const result = await bulkUpdateTests(reqData)
    // @ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    afterBulkSubmit()
  }

  const handleMoveSubmit = async (plan: number) => {
    const reqData = prepareBulkRequestData()
    reqData.plan = plan

    handleClearAll()
    const result = await bulkUpdateTests(reqData)
    //@ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    afterBulkSubmit()
  }

  return {
    data: data?.results ?? [],
    test,
    isLoading: isFetching,
    isShowArchive,
    projectId,
    handleSelectRows,
    resetSelectedRows,
    selectedRows,
    excludedRows,
    isAllSelected,
    hasSelection: !!selectedRows.length || isAllSelected,
    handleMoveSubmit,
    paginationTable,
    columns,
    activeTestId: test?.id,
    visibleColumns,
    filteredColumns,
    handleClearAll,
    handleShowArchived,
    handleTableChange,
    handleRowClick,
    handleChangeVisibleColumns,
    isRefreshingTable,
    handleBulkAssignSubmit,
  }
}
