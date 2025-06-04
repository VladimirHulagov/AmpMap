import { PlusOutlined } from "@ant-design/icons"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  onClick: () => void
}

export const AddStep = ({ onClick }: Props) => {
  const { t } = useTranslation()
  return (
    <Button
      data-testid="add-step-btn"
      color="secondary-linear"
      block
      onClick={onClick}
      className={styles.button}
    >
      <PlusOutlined /> {t("Add step")}
    </Button>
  )
}
