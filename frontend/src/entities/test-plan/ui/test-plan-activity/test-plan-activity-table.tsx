import { Empty, Pagination, Table, Typography } from "antd"
import dayjs from "dayjs"

import { useTestPlanActivity } from "entities/test-plan/model"

import { ContainerLoader } from "shared/ui"

export const TestPlanActivityTable = ({
  testPlanActivity,
}: {
  testPlanActivity: ReturnType<typeof useTestPlanActivity>
}) => {
  if (!testPlanActivity.data || testPlanActivity.isLoading) return <ContainerLoader />

  if (!testPlanActivity.data.count) return <Empty />

  return (
    <ul style={{ paddingLeft: 0 }}>
      {Object.entries(testPlanActivity.data.results).map(([dayStr, item], index) => (
        <li style={{ marginBottom: 24, listStyle: "none" }} key={`${index}_${dayStr}`}>
          <Typography.Paragraph strong>{dayjs(dayStr).format("D MMMM YYYY")}</Typography.Paragraph>
          <Table
            columns={testPlanActivity.columns}
            dataSource={item}
            rowKey="id"
            pagination={false}
          />
        </li>
      ))}
      <Pagination
        defaultCurrent={1}
        pageSize={10}
        total={testPlanActivity.data.count}
        style={{ width: "fit-content", marginLeft: "auto" }}
        onChange={testPlanActivity.handlePaginationChange}
      />
    </ul>
  )
}
