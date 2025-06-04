import { QueryStatus } from "@reduxjs/toolkit/dist/query"
import { Modal, Table, Typography } from "antd"
import { ColumnsType } from "antd/lib/table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

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
  const { t } = useTranslation()

  const columns: ColumnsType<T> = [
    {
      title: t("Verbose Name"),
      dataIndex: "verbose_name",
    },
    {
      title: t("Verbose Name Related Model"),
      dataIndex: "verbose_name_related_model",
    },
    {
      title: t("Count"),
      dataIndex: "count",
      align: "right",
    },
  ]

  const dataClear = useMemo(() => {
    return data.filter((i) => Boolean(i.count)).map((i, index) => ({ ...i, id: index }))
  }, [data])

  return (
    <Modal
      data-testid={`${type}-${action}-modal`}
      bodyProps={{ "data-testid": `${type}-${action}-modal-body` }}
      wrapProps={{ "data-testid": `${type}-${action}-modal-wrapper` }}
      open={isShow}
      title={`${action === "archive" ? t("Archive") : t("Delete")} ${typeTitle} '${name}'`}
      onCancel={handleClose}
      width="530px"
      footer={[
        <Button
          id={`cancel-${type}-${action}`}
          key="back"
          onClick={handleClose}
          color="secondary-linear"
        >
          {t("Cancel")}
        </Button>,
        <Button
          id={`update-${type}-edit`}
          key="submit"
          danger
          onClick={handleDelete}
          loading={isLoadingButton || isLoading}
          color="secondary-linear"
        >
          {action === "archive" ? t("Archive") : t("Delete")}
        </Button>,
      ]}
    >
      <Typography.Paragraph>
        {t("Attention")}: {action === "archive" ? t("Archiving") : t("Deleting")}{" "}
        {t("the selected data in this table will remove it from view")}
      </Typography.Paragraph>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={dataClear}
        size="small"
        pagination={false}
        loading={status === "pending"}
        data-testid={`${type}-${action}-modal-table`}
      />
    </Modal>
  )
}
