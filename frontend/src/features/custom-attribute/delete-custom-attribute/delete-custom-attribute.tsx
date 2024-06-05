import { DeleteOutlined } from "@ant-design/icons"
import { Button, Modal, notification } from "antd"
import { useDeleteCustomAttributeMutation } from "entities/custom-attribute/api"

import { initInternalError } from "shared/libs"

interface Props {
  attributeId: Id
}

export const DeleteCustomAttribute = ({ attributeId }: Props) => {
  const [deleteAttribute] = useDeleteCustomAttributeMutation()

  const handleDeleteAttribute = (AttributeId: Id) => {
    Modal.confirm({
      title: "Do you want to delete these attribute?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteAttribute(AttributeId).unwrap()
          notification.success({
            message: "Success",
            description: "Attribute deleted successfully",
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
      onClick={() => handleDeleteAttribute(Number(attributeId))}
    />
  )
}
