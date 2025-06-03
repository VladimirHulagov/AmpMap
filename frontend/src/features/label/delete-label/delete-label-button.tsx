import { DeleteOutlined } from "@ant-design/icons"
import { useTranslation } from "react-i18next"

import { useDeleteLabelMutation } from "entities/label/api"

import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"

interface Props {
  label: Label
}

export const DeleteLabelButton = ({ label }: Props) => {
  const { t } = useTranslation()
  const [deleteLabel] = useDeleteLabelMutation()

  const handleDeleteLabel = () => {
    antdModalConfirm("delete-label", {
      title: t("Do you want to delete these label?"),
      okText: t("Delete"),
      onOk: async () => {
        try {
          await deleteLabel(Number(label.id)).unwrap()
          antdNotification.success("delete-label", {
            description: t("Label deleted successfully"),
          })
        } catch (err: unknown) {
          initInternalError(err)
        }
      },
    })
  }

  return (
    <Button
      id={`${label.name}-delete-label-button`}
      icon={<DeleteOutlined />}
      shape="circle"
      danger
      color="secondary-linear"
      onClick={handleDeleteLabel}
    />
  )
}
