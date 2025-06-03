import { useTranslation } from "react-i18next"

import ResetIcon from "shared/assets/yi-icons/reset.svg?react"
import { Button } from "shared/ui"

interface Props {
  isVisible: boolean
  onClear: () => void
}

export const ClearFilters = ({ isVisible, onClear }: Props) => {
  const { t } = useTranslation()

  if (!isVisible) return null

  return (
    <Button
      id="btn-clear-filter-test-plan"
      icon={<ResetIcon width={16} height={16} />}
      onClick={onClear}
      color="ghost"
      style={{ gap: 4, width: "fit-content" }}
    >
      {t("Clear")}
    </Button>
  )
}
