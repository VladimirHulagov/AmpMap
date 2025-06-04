import { DeleteOutlined } from "@ant-design/icons"
import { Button, Tooltip } from "antd"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"

import { DeleteProjectModal } from "./delete-project-modal"

interface Props {
  project: Project
  as?: ReactNode
  asProps?: React.ComponentProps<"div">
}

const TEST_ID = "delete-project"

export const DeleteProject = ({ project, as, asProps }: Props) => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const handleClick = () => {
    setIsShow(true)
  }

  return (
    <>
      {as ? (
        <div onClick={handleClick} data-testid={TEST_ID} {...asProps}>
          {as}
        </div>
      ) : (
        <Tooltip title={t("Delete project")}>
          <Button
            id="delete-project"
            icon={<DeleteOutlined />}
            danger
            type="text"
            onClick={handleClick}
          />
        </Tooltip>
      )}
      <DeleteProjectModal isShow={isShow} setIsShow={setIsShow} project={project} />
    </>
  )
}
