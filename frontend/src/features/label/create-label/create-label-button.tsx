import { PlusOutlined } from "@ant-design/icons"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import { CreateEditLabelModal } from "../create-edit-label-modal/create-edit-label-modal"

export const CreateLabelButton = () => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const handleShow = () => {
    setIsShow(true)
  }

  return (
    <>
      <Button
        id="create-label-button"
        color="accent"
        icon={<PlusOutlined />}
        onClick={handleShow}
        style={{ marginBottom: 16, float: "right" }}
      >
        {t("Create")} {t("Label")}
      </Button>
      <CreateEditLabelModal mode="create" isShow={isShow} setIsShow={setIsShow} />
    </>
  )
}
