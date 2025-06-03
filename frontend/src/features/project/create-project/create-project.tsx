import { PlusOutlined } from "@ant-design/icons"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import { CreateProjectModal } from "./create-project-modal"

export const CreateProject = () => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const handleClick = () => {
    setIsShow(true)
  }

  return (
    <>
      <Button
        id="create-project"
        icon={<PlusOutlined />}
        color="secondary-linear"
        onClick={handleClick}
      >
        {t("Create")} {t("Project")}
      </Button>
      <CreateProjectModal isShow={isShow} setIsShow={setIsShow} />
    </>
  )
}
