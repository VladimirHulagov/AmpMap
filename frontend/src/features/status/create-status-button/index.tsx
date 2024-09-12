import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useAdministrationStatusModal } from "entities/status/model"

import { StatusCreateEditModal } from "../status-create-edit-modal"

export const CreateStatusButton = () => {
  const statusModal = useAdministrationStatusModal()
  const handleCreateClick = () => {
    statusModal.handleModalOpen({ mode: "create" })
  }

  return (
    <>
      <Button
        id="create-status"
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleCreateClick}
        style={{ marginBottom: 16, float: "right" }}
      >
        Create status
      </Button>
      {statusModal.isShow && <StatusCreateEditModal data={statusModal} />}
    </>
  )
}
