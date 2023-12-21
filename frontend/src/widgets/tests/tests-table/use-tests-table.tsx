import { LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Button, TableProps, Tag, notification } from "antd"
import { ColumnsType } from "antd/es/table"
import type { FilterValue, TablePaginationConfig } from "antd/es/table/interface"
import { Key, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { selectSelectedLabels } from "entities/label/model"

import { useLazyGetTestsQuery } from "entities/test/api"
import { useTestsTableParams } from "entities/test/model"
import { selectTest, setTest } from "entities/test/model/slice"

import { selectArchivedTestsIsShow, showArchivedTests } from "entities/test-plan/model"

import { UserAvatar, UserUsername } from "entities/user/ui"

import { colors } from "shared/config"
import { useTableSearch } from "shared/hooks"
import { HighLighterTesty, Status } from "shared/ui"

import { AssigneeFiltersDrowdown } from "./filters/assignee-filters-dropdown"
import { SuiteFiltersDrowdown } from "./filters/suite-filters-dropdown"

// TODO need refacroting
export const useTestsTable = (testPlanId: Id) => {
  const dispatch = useDispatch()
  const showArchive = useAppSelector(selectArchivedTestsIsShow)
  const [getTests, { data: tests, isLoading }] = useLazyGetTestsQuery()
  const selectedLabels = useAppSelector(selectSelectedLabels)

  const { setSearchText, getColumnSearch, searchText } = useTableSearch()
  const { tableParams, setTableParams, reset } = useTestsTableParams()
  const [requestDataState, setRequestDataState] = useState("")
  const { projectId } = useParams<ParamProjectId>()
  const [searchParams, setSearchParams] = useSearchParams()
  const test = useAppSelector(selectTest)

  const [selectedSuites, setSelectedSuites] = useState<Key[]>([])

  useEffect(() => {
    reset()
  }, [testPlanId])

  // TODO need refactoring next code
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const currentPage =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Number(testPlanId) !== Number(tableParams.testPlanId) ? 1 : tableParams.pagination?.current

    ;(async () => {
      const requestData = {
        plan: testPlanId,
        project: projectId ?? "",
        is_archive:
          (tableParams.filters?.is_archive && tableParams.filters?.is_archive[0]) ?? showArchive,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        page_size: tableParams.pagination?.pageSize,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        page: currentPage,
        last_status: tableParams.filters?.last_status?.join(","),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        search: tableParams.filters?.name ? (tableParams.filters?.name[0] as string) : undefined,
        labels: selectedLabels.labels,
        not_labels: selectedLabels.not_labels,
        labels_condition: tableParams.filters?.labels_condition,
        suite: tableParams.filters?.suite,
        assignee: tableParams.filters?.assignee_id,
        unassigned: tableParams.filters?.unassigned,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ordering: tableParams.sorter ? tableParams.sorter : undefined,
      }

      const requestDataWithNonce = { ...requestData, nonce: tableParams.nonce }

      // hack for remove duplicate requests
      if (JSON.stringify(requestDataWithNonce) === requestDataState) return
      setRequestDataState(JSON.stringify(requestDataWithNonce))

      // TODO тут баг при быстрой смене
      // tableParams запросы перетирают друг друга и уходят в рекурсию нужна полная смена функционала
      await fetchTests(requestData, testPlanId)
    })()
  }, [showArchive, tableParams, testPlanId, selectedLabels])

  const fetchTests = async (
    requestData: QueryWithPagination<ITestGetWithFilters>,
    testPlanId: number
  ) => {
    try {
      const request = await getTests(requestData)

      setTableParams({
        pagination: {
          total: request.data?.count ?? 0,
        },
        testPlanId,
      })
      return request
    } catch (error) {
      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }
  }

  const handleAssignUserChange = (data?: SelectData) => {
    setTableParams({
      filters: {
        assignee_id: data ? String(data?.value) : undefined,
        unassigned: undefined,
      },
    })
  }

  const handleUnAssignUser = () => {
    setTableParams({
      filters: {
        assignee_id: undefined,
        unassigned: true,
      },
    })
  }

  const handleResetAssignee = () => [
    setTableParams({
      filters: {
        assignee_id: undefined,
        unassigned: undefined,
      },
    }),
  ]

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
        <Link to={`/projects/${record.project}/suites/${record.suite}/?test_case=${record.case}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
          <HighLighterTesty searchWords={searchText} textToHighlight={text} />
        </Link>
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
          setSelectedKeys: setSelectedSuites,
          close,
        }),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "is_archive",
      width: "100px",
      filters: [
        {
          text: "Archived",
          value: true,
        },
      ],
      onFilter: (_, record) => record.is_archive,
      render: (_, record) => {
        return record.is_archive ? <Tag color={colors.error}>Archived</Tag> : null
      },
    },
    {
      title: "Last status",
      dataIndex: "last_status",
      key: "last_status",
      width: "150px",
      filters: [
        {
          value: "0",
          text: "Failed",
        },
        {
          value: "1",
          text: "Passed",
        },
        {
          value: "2",
          text: "Skipped",
        },
        {
          value: "3",
          text: "Broken",
        },
        {
          value: "4",
          text: "Blocked",
        },
        {
          value: "6",
          text: "Retest",
        },
        {
          value: "null",
          text: "Untested",
        },
      ],
      render: (last_status: Statuses) => <Status value={last_status || "Untested"} />,
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

  const onChange: TableProps<Test>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter
  ) => {
    const newState = {
      pagination,
      filters: filters as Record<string, FilterValue>,
      sorter,
    }
    setTableParams(newState)
  }

  const onShowArchived = () => {
    dispatch(showArchivedTests())
  }

  const clearAll = () => {
    reset()
    setTableParams({
      filters: {},
      sorter: "",
      pagination: {
        current: 1,
        pageSize: 10,
      },
    })
    setSearchText("")
  }

  const handleRowClick = (testClick: Test) => {
    if (!test) {
      setSearchParams({ test: String(testClick.id) })
      dispatch(setTest(testClick))
    } else if (test.id === testClick.id) {
      searchParams.delete("test")
      setSearchParams(searchParams)
      dispatch(setTest(null))
    } else {
      setSearchParams({ test: String(testClick.id) })
      dispatch(setTest(testClick))
    }
  }

  return {
    clearAll,
    onShowArchived,
    onChange,
    handleRowClick,
    columns,
    test,
    tests,
    isLoading,
    showArchive,
    tableParams,
    projectId,
  }
}
