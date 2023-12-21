import Search from "antd/lib/input/Search"
import { ColumnsType } from "antd/lib/table"

import { useTestPlanActivity } from "./use-test-plan-activity"

export const useTestPlanActivityFilters = (
  testPlanActivity: ReturnType<typeof useTestPlanActivity>
) => {
  const filters: ColumnsType<TestPlanActivityResult> = [
    {
      title: "Time",
      dataIndex: "action_timestamp",
      key: "action_timestamp",
      width: "150px",
      sorter: true,
      filteredValue: testPlanActivity.filteredInfo?.action_timestamp ?? null,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: "150px",
      filteredValue: testPlanActivity.filteredInfo?.action ?? null,
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
    },
    {
      title: "Status",
      dataIndex: "status_text",
      key: "status_text",
      width: "150px",
      filteredValue: testPlanActivity.filteredInfo?.status_text ?? null,
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
    },
    {
      title: (
        <Search
          placeholder="Search by test or user"
          onSearch={testPlanActivity.handleSearch}
          value={testPlanActivity.searchText}
          onChange={(e) => testPlanActivity.handleSearchChange(e.target.value)}
        />
      ),
    },
  ]

  return {
    filters,
    handleChange: testPlanActivity.handleTableChange,
  }
}
