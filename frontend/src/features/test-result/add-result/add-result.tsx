import { PlusOutlined } from "@ant-design/icons"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

interface Props {
  isDisabled: boolean
  onClick?: () => void
}

export const AddResult = ({ isDisabled, onClick }: Props) => {
  const { t } = useTranslation()

  return (
    <Button
      id="add-result-btn"
      onClick={onClick}
      color="accent"
      icon={<PlusOutlined />}
      disabled={isDisabled}
    >
      {t("Add Result")}
    </Button>
  )
}
