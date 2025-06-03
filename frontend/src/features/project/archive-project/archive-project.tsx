import { Button, Tooltip } from "antd"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"

import ArchiveIcon from "shared/assets/yi-icons/archive.svg?react"

import { ArchiveProjectModal } from "./archive-project-modal"

interface Props {
  project: Project
  as?: ReactNode
  asProps?: React.ComponentProps<"div">
}

const TEST_ID = "archive-project"

export const ArchiveProject = ({ project, as, asProps }: Props) => {
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
        <Tooltip title={t("Archive project")}>
          <Button
            id={TEST_ID}
            style={{ color: "var(--y-grey-30)" }}
            icon={<ArchiveIcon width={24} height={24} />}
            type="text"
            onClick={handleClick}
          />
        </Tooltip>
      )}
      <ArchiveProjectModal isShow={isShow} setIsShow={setIsShow} project={project} />
    </>
  )
}
