import { DeleteOutlined } from "@ant-design/icons"
import { useUnassignRoleMutation } from "entities/roles/api"
import { selectRoleOnSuccess } from "entities/roles/model"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"

interface Props {
  user: User
}

export const DeleteUsetProjectAccess = ({ user }: Props) => {
  const { t } = useTranslation()
  const [unassignUser] = useUnassignRoleMutation()
  const onSuccess = useAppSelector(selectRoleOnSuccess)
  const { projectId } = useParams<ParamProjectId>()
  const handleModalConfirm = async () => {
    try {
      await unassignUser({
        user: user.id,
        project: Number(projectId),
      }).unwrap()

      antdNotification.success("delete-user-project-access", {
        description: t("User access deleted successfully"),
      })

      onSuccess?.()
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  return (
    <Button
      data-testid={`${user.username}-delete-user-project-access`}
      icon={<DeleteOutlined />}
      shape="circle"
      danger
      color="secondary-linear"
      onClick={() => {
        antdModalConfirm("delete-user-project-access", {
          title: t("Do you want to delete user from project?"),
          okText: t("Delete"),
          onOk: handleModalConfirm,
        })
      }}
    />
  )
}
