import { Typography } from "antd"
import Table from "antd/lib/table"

import { useProjectOverviewProgress } from "entities/project/model"

import styles from "./styles.module.css"

export const ProjectOverviewProgressBlock = () => {
  const { columns, data, isLoading } = useProjectOverviewProgress()

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Typography.Title level={4}>Executed tests progress</Typography.Title>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="test_plan_id"
        className={styles.table}
        pagination={{
          size: "small",
          defaultPageSize: 5,
        }}
        id="projects-overview-table"
        loading={isLoading}
      />
    </div>
  )
}
