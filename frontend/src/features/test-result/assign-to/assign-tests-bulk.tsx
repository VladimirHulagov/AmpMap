import { Flex } from "antd"
import { useTranslation } from "react-i18next"

import UserIcon from "shared/assets/yi-icons/user.svg?react"

import { AssingToModal } from "./assign-to-modal"
import { useAssignToCommon } from "./use-assign-to-common"

interface Props {
  isLoading?: boolean
  onSubmit: (id: string) => Promise<void>
}

export const AssignTestsBulk = ({ isLoading, onSubmit }: Props) => {
  const { t } = useTranslation()
  const {
    isOpen,
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
      <Flex align="center" id="assign-to-btn" key="submit" onClick={handleOpenAssignModal}>
        <UserIcon width={16} height={16} style={{ marginRight: 8 }} />
        {t("Assign To")}
      </Flex>
      <AssingToModal
        isOpenModal={isOpen}
        errors={errors}
        isDirty={isDirty}
        isLoadingUpdateTest={isLoading ?? false}
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
