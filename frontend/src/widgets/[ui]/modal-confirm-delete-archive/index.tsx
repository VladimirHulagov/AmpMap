import { QueryStatus } from "@reduxjs/toolkit/dist/query"
import { Button, Modal, Table, Typography } from "antd"
import { ColumnsType } from "antd/lib/table"
import { useMemo } from "react"

interface Props<T> {
  status: QueryStatus
  isShow: boolean
  isLoading: boolean
  isLoadingButton: boolean
  handleClose: () => void
  handleDelete: () => Promise<void>
  data: T[]
  type: "test-plan" | "test-suite" | "test-case" | "test" | "project"
  typeTitle: string
  name: string
  action: "delete" | "archive"
}

interface DataType {
  verbose_name: string
  verbose_name_related_model: string
  count: number
}

// eslint-disable-next-line comma-spacing
export const ModalConfirmDeleteArchive = <T extends DataType>({
  status,
  isShow,
  name,
  handleClose,
  isLoading,
  isLoadingButton,
  handleDelete,
  data,
  type,
  typeTitle,
  action,
}: Props<T>) => {
  const columns: ColumnsType<T> = [
    {
      title: "Verbose Name",
      dataIndex: "verbose_name",
    },
    {
      title: "Verbose Name Related Model",
      dataIndex: "verbose_name_related_model",
    },
    {
      title: "Count",
      dataIndex: "count",
      align: "right",
    },
  ]

  const dataClear = useMemo(() => {
    return data.filter((i) => Boolean(i.count)).map((i, index) => ({ ...i, id: index }))
  }, [data])

  return (
    <Modal
      className={`${type}-${action}-modal`}
      open={isShow}
      title={`${action === "archive" ? "Archive" : "Delete"} ${typeTitle} '${name}'`}
      onCancel={handleClose}
      width="530px"
      footer={[
        <Button id={`cancel-${type}-${action}`} key="back" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          id={`update-${type}-edit`}
          key="submit"
          type="primary"
          danger
          onClick={handleDelete}
          loading={isLoadingButton || isLoading}
        >
          {action === "archive" ? "Archive" : "Delete"}
        </Button>,
      ]}
    >
      <Typography.Paragraph>
        Attention: {action === "archive" ? "Archiving" : "Deleting"} the selected data in this table
        will remove it from view
      </Typography.Paragraph>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={dataClear}
        size="small"
        pagination={false}
        loading={status === "pending"}
      />
    </Modal>
  )
}
