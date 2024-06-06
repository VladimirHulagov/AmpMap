import { DeleteOutlined } from "@ant-design/icons"
import { Button, Modal, notification } from "antd"
import { useUnassignRoleMutation } from "entities/roles/api"
import { selectRoleOnSuccess } from "entities/roles/model"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { initInternalError } from "shared/libs"

interface Props {
  user: User
}

export const DeleteUsetProjectAccess = ({ user }: Props) => {
  const [unassignUser] = useUnassignRoleMutation()
  const onSuccess = useAppSelector(selectRoleOnSuccess)
  const { projectId } = useParams<ParamProjectId>()
  const handleModalConfirm = async () => {
    try {
      await unassignUser({
        user: user.id,
        project: Number(projectId),
      }).unwrap()

      notification.success({
        message: "Success",
        description: "User deleted successfully",
      })

      onSuccess?.()
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
          title: "Do you want to delete user from project?",
          okText: "Delete",
          cancelText: "Cancel",
          onOk: handleModalConfirm,
        })
      }}
    />
  )
}
