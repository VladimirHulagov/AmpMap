import { useAdministrationStatusModal } from "entities/status/model"

import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import { Button } from "shared/ui"

import { StatusCreateEditModal } from "../status-create-edit-modal/status-create-edit-modal"

interface Props {
  record: Status
}

export const DeleteStatusButton = ({ record }: Props) => {
  const statusModal = useAdministrationStatusModal()
  return (
    <>
      <Button
        id={`${record.name}-delete`}
        icon={<DeleteIcon width={20} height={20} />}
        shape="circle"
        danger
        color="secondary-linear"
        onClick={() => statusModal.handleDeleteStatus(Number(record.id))}
      />
      {statusModal.isShow && <StatusCreateEditModal data={statusModal} />}
    </>
  )
}
