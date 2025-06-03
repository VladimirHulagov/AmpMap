import { Space, Table } from "antd"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import { useUsersProjectAccessTable } from "./use-users-project-access-table"

interface Props {
  isManageable?: boolean
}

export const UsersProjectAccessTable = ({ isManageable = false }: Props) => {
  const { t } = useTranslation()
  const { columns, isLoading, users, paginationTable, handleChange, clearAll } =
    useUsersProjectAccessTable(isManageable)

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll} color="secondary-linear">
          {t("Clear filters and sorters")}
        </Button>
      </Space>
      <Table
        loading={isLoading}
        dataSource={users}
        columns={columns}
        rowKey="username"
        style={{ marginTop: 12 }}
        onChange={handleChange}
        pagination={paginationTable}
        data-testid="users-project-access-table"
      />
    </>
  )
}
