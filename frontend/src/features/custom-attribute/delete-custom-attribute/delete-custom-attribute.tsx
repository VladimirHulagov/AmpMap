import { DeleteOutlined } from "@ant-design/icons"
import { useDeleteCustomAttributeMutation } from "entities/custom-attribute/api"
import { useTranslation } from "react-i18next"

import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"

interface Props {
  attributeId: Id
}

export const DeleteCustomAttribute = ({ attributeId }: Props) => {
  const { t } = useTranslation()
  const [deleteAttribute] = useDeleteCustomAttributeMutation()

  const handleDeleteAttribute = (AttributeId: Id) => {
    antdModalConfirm("delete-attribute", {
      title: t("Do you want to delete these attribute?"),
      okText: t("Delete"),
      onOk: async () => {
        try {
          await deleteAttribute(AttributeId).unwrap()
          antdNotification.success("delete-custom-attribute", {
            description: t("Attribute deleted successfully"),
          })
        } catch (err: unknown) {
          initInternalError(err)
        }
      },
    })
  }

  return (
    <Button
      id={`delete-custom-attribute-${attributeId}`}
      icon={<DeleteOutlined />}
      shape="circle"
      danger
      color="secondary-linear"
      onClick={() => handleDeleteAttribute(Number(attributeId))}
    />
  )
}
