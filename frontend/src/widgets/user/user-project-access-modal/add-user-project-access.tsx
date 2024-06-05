import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { openRoleModal } from "entities/roles/model"

import { useAppDispatch } from "app/hooks"

export const AddUserProjectAccess = () => {
  const dispatch = useAppDispatch()
  const handleClick = () => {
    dispatch(openRoleModal({ mode: "create" }))
  }

  return (
    <Button
      id="add-user-to-project"
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleClick}
      style={{ marginBottom: 16, float: "right" }}
    >
      Add user to project
    </Button>
  )
}
