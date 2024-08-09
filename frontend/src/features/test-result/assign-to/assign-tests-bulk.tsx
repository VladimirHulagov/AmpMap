import { UserAddOutlined } from "@ant-design/icons"
import { Button } from "antd"

import { AssingToModal } from "./assign-to-modal"
import { useAssignToCommon } from "./use-assign-to-common"

interface Props {
  onSubmit: (id: string) => Promise<void>
}

export const AssignTestsBulk = ({ onSubmit }: Props) => {
  const {
    isOpenModal,
    errors,
    isDirty,
    selectedUser,
    handleClose,
    handleOpenAssignModal,
    handleSubmitForm,
    handleAssignUserChange,
    handleAssignUserClear,
    handleAssignToMe,
  } = useAssignToCommon({ onSubmit })

  return (
    <>
      <Button
        id="assign-to-btn"
        icon={<UserAddOutlined style={{ fontSize: 14 }} />}
        key="submit"
        onClick={handleOpenAssignModal}
      >
        Assign To
      </Button>
      <AssingToModal
        isOpenModal={isOpenModal}
        errors={errors}
        isDirty={isDirty}
        isLoadingUpdateTest={false}
        selectedUser={selectedUser}
        handleClose={handleClose}
        handleOpenAssignModal={handleOpenAssignModal}
        handleSubmitForm={handleSubmitForm}
        handleAssignUserChange={handleAssignUserChange}
        handleAssignUserClear={handleAssignUserClear}
        handleAssignToMe={handleAssignToMe}
        isAssignToMe={false}
      />
    </>
  )
}
