import { EditOutlined } from "@ant-design/icons"
import { openRoleModal } from "entities/roles/model"

import { useAppDispatch } from "app/hooks"

import { Button } from "shared/ui"

interface Props {
  user: UserWithRoles
}

export const EditUserProjectAccess = ({ user }: Props) => {
  const dispatch = useAppDispatch()
  const handleClick = () => {
    dispatch(openRoleModal({ mode: "edit", user }))
  }
  return (
    <Button
      data-testid={`${user.username}-edit-user-project-access`}
      icon={<EditOutlined />}
      shape="circle"
      color="secondary-linear"
      onClick={handleClick}
    />
  )
}
