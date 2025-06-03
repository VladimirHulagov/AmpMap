import { Switch, Tooltip } from "antd"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useGetProjectQuery, useUpdateProjectJsonMutation } from "entities/project/api"

import { antdNotification } from "shared/libs/antd-modals"

interface Props {
  record: Status
}

export const SetDefaultStatusButton = ({ record }: Props) => {
  const { t } = useTranslation()
  const { projectId } = useParams<ParamProjectId>()
  const { data: project, isLoading: isProjectLoading } = useGetProjectQuery(Number(projectId), {
    skip: !projectId,
  })
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectJsonMutation()

  const isDefault = project?.settings.default_status === record.id

  const handleSetDefaultStatus = async () => {
    if (!project) return

    const newDefaultStatus = isDefault ? null : record.id
    try {
      await updateProject({
        id: project.id,
        body: {
          settings: {
            ...project.settings,
            default_status: newDefaultStatus,
          },
        },
      }).unwrap()

      antdNotification.success("set-default-status", {
        description:
          newDefaultStatus === null
            ? t("Default status removed")
            : `${t("Default status updated to")} ${record.name}`,
      })
    } catch (error) {
      console.error("Failed to update default status:", error)
      antdNotification.error("set-default-status", {
        description: t("Failed to update default status"),
      })
    }
  }

  return (
    <Tooltip title="Set as default status for the project">
      <Switch
        id={`${record.name}-set-default`}
        checked={isDefault}
        onChange={handleSetDefaultStatus}
        loading={isProjectLoading || isUpdating}
      />
    </Tooltip>
  )
}
