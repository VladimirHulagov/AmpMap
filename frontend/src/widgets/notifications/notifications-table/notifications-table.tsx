import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons"
import { Table } from "antd"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import styles from "./notifications-table.module.css"
import { useNotificationsTable } from "./use-noitifications-table"

export const NotificationsTable = () => {
  const { t } = useTranslation()
  const {
    isLoading,
    data,
    pagination,
    selectedRowKeys,
    columns,
    handleChange,
    handleSelectRows,
    handleRead,
    handleUnread,
  } = useNotificationsTable()

  return (
    <>
      {!!selectedRowKeys.length && (
        <div>
          <Button
            key="mark-as-read"
            onClick={handleRead}
            icon={<EyeOutlined />}
            disabled={!selectedRowKeys.length}
            color="secondary-linear"
          >
            {t("Mark as read")}
          </Button>
          <Button
            key="mark-as-unread"
            onClick={handleUnread}
            icon={<EyeInvisibleOutlined />}
            disabled={!selectedRowKeys.length}
            style={{ marginLeft: 8 }}
            color="secondary-linear"
          >
            {t("Mark as unread")}
          </Button>
        </div>
      )}
      <Table
        loading={isLoading}
        dataSource={data}
        columns={columns}
        rowKey="id"
        style={{ marginTop: 12 }}
        id="notifications-table"
        rowClassName={(record) => {
          return record.unread ? styles.unreadRow : styles.readRow
        }}
        pagination={pagination}
        onChange={handleChange}
        rowSelection={{
          type: "checkbox",
          onChange: handleSelectRows,
          selectedRowKeys,
        }}
        data-testid="notifications-table"
      />
    </>
  )
}
