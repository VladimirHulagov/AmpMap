import { DeleteOutlined } from "@ant-design/icons"
import { Button, Modal, notification } from "antd"
import { useTranslation } from "react-i18next"

import { useDeleteUserMutation } from "entities/user/api"

import { initInternalError } from "shared/libs"

export const DeleteUser = ({ user }: { user: User }) => {
  const { t } = useTranslation()
  const [deleteUser] = useDeleteUserMutation()
  const handleModalConfirm = async () => {
    try {
      await deleteUser(user.id).unwrap()
      notification.success({
        message: t("Success"),
        closable: true,
        description: t("User deleted successfully"),
      })
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  return (
    <Button
      id="delete-user-details"
      icon={<DeleteOutlined />}
      shape="circle"
      danger
      onClick={() => {
        Modal.confirm({
          title: t("Do you want to delete these user?"),
          okText: t("Delete"),
          cancelText: t("Cancel"),
          onOk: handleModalConfirm,
        })
      }}
    />
  )
}
