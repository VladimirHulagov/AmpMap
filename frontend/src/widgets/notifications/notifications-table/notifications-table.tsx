import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons"
import { Button, Divider, Table } from "antd"

import styles from "./notifications-table.module.css"
import { useNotificationsTable } from "./use-noitifications-table"

export const NotificationsTable = () => {
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
      <p style={{ margin: 0, fontSize: 18 }}>Messages</p>
      <Divider />
      {!!selectedRowKeys.length && (
        <div>
          <Button
            key="mark-as-read"
            onClick={handleRead}
            icon={<EyeOutlined />}
            disabled={!selectedRowKeys.length}
          >
            Mark as read
          </Button>
          <Button
            key="mark-as-unread"
            onClick={handleUnread}
            icon={<EyeInvisibleOutlined />}
            disabled={!selectedRowKeys.length}
            style={{ marginLeft: 8 }}
          >
            Mark as unread
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
      />
    </>
  )
}
