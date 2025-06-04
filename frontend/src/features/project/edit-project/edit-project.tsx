import { Tooltip } from "antd"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import GearIcon from "shared/assets/yi-icons/gear.svg?react"
import { Button } from "shared/ui"

import { EditProjectModal } from "./edit-project-modal"

export const EditProject = ({ project }: { project: Project }) => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const handleClick = () => {
    setIsShow(true)
  }

  return (
    <Tooltip title={t("Edit project")}>
      <Button
        id="edit-project"
        icon={<GearIcon width={32} height={32} color="(--y-color-icon)" />}
        type="button"
        color="ghost"
        shape="square"
        onClick={handleClick}
      />
      <EditProjectModal isShow={isShow} setIsShow={setIsShow} project={project} />
    </Tooltip>
  )
}
