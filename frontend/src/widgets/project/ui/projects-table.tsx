import { Button, Space, Table } from "antd"
import cn from "classnames"

import { useProjectsTable } from "../model/use-projects-table"
import styles from "./styles.module.css"

export const ProjectsTable = () => {
  const {
    isLoading,
    columns,
    projects,
    paginationTable,
    handleClearAll,
    handleChange,
    handleRowClick,
  } = useProjectsTable()

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={handleClearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <Table
        loading={isLoading}
        dataSource={projects?.results ?? []}
        columns={columns}
        rowKey="id"
        style={{ marginTop: 12, cursor: "pointer" }}
        onChange={handleChange}
        pagination={paginationTable}
        rowClassName={(record) => {
          return cn({
            [styles.disabledRow]: record.is_private && !record.is_manageable,
          })
        }}
        onRow={(record) => {
          return {
            onClick: () => handleRowClick(record),
          }
        }}
      />
    </>
  )
}
