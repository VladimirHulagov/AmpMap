import { DeleteOutlined } from "@ant-design/icons"
import { useTranslation } from "react-i18next"

import { useDeleteUserMutation } from "entities/user/api"

import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"

export const DeleteUser = ({ user }: { user: User }) => {
  const { t } = useTranslation()
  const [deleteUser] = useDeleteUserMutation()
  const handleModalConfirm = async () => {
    try {
      await deleteUser(user.id).unwrap()
      antdNotification.success("delete-user", {
        description: t("User deleted successfully"),
      })
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  return (
    <Button
      id={`delete-user-details-${user.username}`}
      data-testid={`delete-user-details-${user.username}`}
      icon={<DeleteOutlined />}
      shape="circle"
      danger
      color="secondary-linear"
      onClick={() => {
        antdModalConfirm("delete-user", {
          title: t("Do you want to delete these user?"),
          okText: t("Delete"),
          onOk: handleModalConfirm,
        })
      }}
    />
  )
}
