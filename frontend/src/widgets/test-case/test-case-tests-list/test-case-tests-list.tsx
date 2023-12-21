import { Table } from "antd"
import { TableProps } from "antd/es/table"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table"
import { FilterValue } from "antd/lib/table/interface"
import { useState } from "react"
import { Link } from "react-router-dom"

import { useGetTestCaseTestsListQuery } from "entities/test-case/api"

import { useTestPlanActivityBreadcrumbs } from "entities/test-plan/model"

import { UserAvatar, UserUsername } from "entities/user/ui"

import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"
import { ContainerLoader, Status } from "shared/ui"

interface TableParams {
  sorter: string
  filters: Record<string, FilterValue | null>
}

export const TestCaseTestsList = ({ testCase }: { testCase: TestCase }) => {
  const { renderBreadCrumbs } = useTestPlanActivityBreadcrumbs()
  const [tableParams, setTableParams] = useState<TableParams>({ sorter: "", filters: {} })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 5,
  })

  const { data, isLoading } = useGetTestCaseTestsListQuery(
    {
      testCaseId: testCase.id,
      page: pagination.page,
      page_size: pagination.page_size,
      ordering: tableParams.sorter ? tableParams.sorter : "",
      last_status: tableParams.filters?.last_status?.join(",") ?? undefined,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  )

  const handlePaginationChange = (page: number, page_size: number) => {
    setPagination({ page, page_size })
  }

  const columns: ColumnsType<TestsWithPlanBreadcrumbs> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: "70px",
      sorter: true,
      render: (value, record) => (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        <Link to={`/projects/${record.project}/plans/${record.plan}?test=${record.id}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access*/}
          {record.id}
        </Link>
      ),
    },
    {
      title: "Test Plan",
      dataIndex: "breadcrumbs",
      key: "breadcrumbs",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      render: (value) => renderBreadCrumbs(value),
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
          value: "5",
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
      render: (_, record) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!record.assignee_username) {
          return <span style={{ opacity: 0.7 }}>Nobody</span>
        }

        return (
          <div style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 8 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access*/}
            <UserAvatar size={32} avatar_link={record.avatar_link} />
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access*/}
            <UserUsername username={record.assignee_username} />
          </div>
        )
      },
    },
  ]

  const handleChange: TableProps<TestsWithPlanBreadcrumbs>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter
  ) => {
    const testySorting = antdSorterToTestySort(sorter, "tests")
    setTableParams({ sorter: testySorting, filters })
  }

  if (isLoading || !data) return <ContainerLoader />

  return (
    <>
      <Table
        dataSource={data.results}
        style={{ cursor: "pointer" }}
        columns={columns}
        pagination={{
          onChange: handlePaginationChange,
          pageSize: pagination.page_size,
          current: pagination.page,
          total: data.count,
        }}
        size="small"
        onChange={handleChange}
        rowKey="id"
      />
    </>
  )
}
