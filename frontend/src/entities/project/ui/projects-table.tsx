import { Button, Space, Table } from "antd"

import { ContainerLoader } from "shared/ui"

import { useProjectsTable } from "../model"

export const ProjectsTable = () => {
  const { isLoading, columns, projects, clearAll, handleChange, handleRowClick } =
    useProjectsTable()

  if (isLoading) {
    return <ContainerLoader />
  }

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <Table
        dataSource={projects}
        columns={columns}
        rowKey="id"
        style={{ marginTop: 12, cursor: "pointer" }}
        onChange={handleChange}
        onRow={(record) => {
          return {
            onClick: () => handleRowClick(record.id),
          }
        }}
      />
    </>
  )
}
