import { EditOutlined } from "@ant-design/icons"
import { Flex } from "antd"
import { useTranslation } from "react-i18next"

import { useModal } from "shared/hooks"

import { CreateBulkResultModal } from "./create-bulk-result-modal"

interface Props {
  onSubmit: (formData: AddBulkResultFormData) => Promise<void>
  getBulkRequestData: () => TestBulkUpdate
  selectedCount: number
}

export const AddBulkResult = ({ onSubmit, selectedCount, getBulkRequestData }: Props) => {
  const { t } = useTranslation()
  const { handleClose, handleShow, isShow } = useModal()

  return (
    <>
      <Flex align="center" id="add-bulk-result-menu-item" onClick={handleShow}>
        <EditOutlined width={16} height={16} style={{ marginRight: 8 }} />
        {t("Add Results")}
      </Flex>
      {isShow && (
        <CreateBulkResultModal
          isShow={isShow}
          onClose={handleClose}
          onSubmit={onSubmit}
          selectedCount={selectedCount}
          getBulkRequestData={getBulkRequestData}
        />
      )}
    </>
  )
}
