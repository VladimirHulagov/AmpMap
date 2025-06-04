import { PlusOutlined } from "@ant-design/icons"
import { openRoleModal } from "entities/roles/model"
import { useTranslation } from "react-i18next"

import { useAppDispatch } from "app/hooks"

import { Button } from "shared/ui"

export const AddUserProjectAccess = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const handleClick = () => {
    dispatch(openRoleModal({ mode: "create" }))
  }

  return (
    <Button
      id="add-user-to-project"
      color="accent"
      icon={<PlusOutlined />}
      onClick={handleClick}
      style={{ marginBottom: 16, float: "right" }}
    >
      {t("Add user to project")}
    </Button>
  )
}
