import { DeleteOutlined } from "@ant-design/icons"
import { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { Button, Modal, notification } from "antd"

import { useDeleteUserMutation } from "entities/user/api"

export const DeleteUser = ({ user }: { user: User }) => {
  const [deleteUser] = useDeleteUserMutation()
  const handleModalConfirm = async () => {
    try {
      await deleteUser(user.id).unwrap()
      notification.success({
        message: "Success",
        description: "User deleted successfully",
      })
    } catch (err: unknown) {
      const error = err as FetchBaseQueryError

      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
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
          title: "Do you want to delete these User?",
          okText: "Delete",
          cancelText: "Cancel",
          onOk: handleModalConfirm,
        })
      }}
    />
  )
}
