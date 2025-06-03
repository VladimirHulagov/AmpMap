import { Flex } from "antd"
import { useTranslation } from "react-i18next"

import LocationIcon from "shared/assets/yi-icons/location.svg?react"
import { useModal } from "shared/hooks"

import { ChangeBulkLabelModal } from "./change-bulk-label-modal"

interface Props {
  onSubmit: (labels: LabelInForm[], operationType: ChangeLabelBulkOperationType) => Promise<void>
  selectedCount: number
}

export const ChangeBulkLabel = ({ onSubmit, selectedCount }: Props) => {
  const { t } = useTranslation()
  const { handleClose, handleShow, isShow } = useModal()

  return (
    <>
      <Flex align="center" id="change-bulk-label-menu-item" onClick={handleShow}>
        <LocationIcon
          width={16}
          height={16}
          style={{ marginRight: 8, color: "var(--y-color-bulk-change-label-icon)" }}
        />
        {t("Change Labels")}
      </Flex>
      <ChangeBulkLabelModal
        isShow={isShow}
        onClose={handleClose}
        onSubmit={onSubmit}
        selectedCount={selectedCount}
      />
    </>
  )
}
