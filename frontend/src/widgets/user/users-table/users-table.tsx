import { Button, Space, Table } from "antd"

import { ContainerLoader } from "shared/ui"

import { useUsersTable } from "./use-users-table"

export const UsersTable = () => {
  const { columns, isLoading, users, paginationTable, handleChange, clearAll } = useUsersTable()

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
        dataSource={users}
        columns={columns}
        rowKey="username"
        style={{ marginTop: 12 }}
        onChange={handleChange}
        pagination={paginationTable}
      />
    </>
  )
}

export default UsersTable
