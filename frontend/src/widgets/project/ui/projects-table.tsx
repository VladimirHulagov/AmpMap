import { Button, Space, Table } from "antd"

import { ContainerLoader } from "shared/ui"

import { useProjectsTable } from "../model/use-projects-table"

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

  if (isLoading || !projects) {
    return <ContainerLoader />
  }

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={handleClearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <Table
        dataSource={projects.results}
        columns={columns}
        rowKey="id"
        style={{ marginTop: 12, cursor: "pointer" }}
        onChange={handleChange}
        pagination={paginationTable}
        onRow={(record) => {
          return {
            onClick: () => handleRowClick(record.id),
          }
        }}
      />
    </>
  )
}
