import { Button, Form, Modal } from "antd"

import { UserSearchInput } from "entities/user/ui"

import styles from "./styles.module.css"
import { UpdateData } from "./use-assign-to-common"

interface Props {
  isOpenModal: boolean
  errors: Partial<UpdateData> | null
  isDirty: boolean
  isLoadingUpdateTest: boolean
  selectedUser: SelectData | undefined
  handleClose: () => void
  handleOpenAssignModal: () => void
  handleSubmitForm: () => void
  handleAssignUserChange: (data?: SelectData) => void
  handleAssignUserClear: () => void
  handleAssignToMe: () => void
  isAssignToMe: boolean
}

export const AssingToModal = ({
  isOpenModal,
  errors,
  isDirty,
  isLoadingUpdateTest,
  selectedUser,
  handleClose,
  handleSubmitForm,
  handleAssignUserChange,
  handleAssignUserClear,
  handleAssignToMe,
  isAssignToMe,
}: Props) => {
  return (
    <Modal
      className="test-assign-to-modal"
      title="Assign To"
      open={isOpenModal}
      onCancel={handleClose}
      footer={[
        <Button key="back" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmitForm}
          disabled={!isDirty && !!selectedUser}
          loading={isLoadingUpdateTest}
        >
          Save
        </Button>,
      ]}
    >
      <Form id="test-assign-form" layout="vertical" onFinish={handleSubmitForm}>
        <Form.Item
          label="Name"
          validateStatus={errors?.assignUserId ? "error" : ""}
          help={errors?.assignUserId ?? ""}
        >
          <UserSearchInput
            selectedUser={selectedUser}
            handleChange={handleAssignUserChange}
            handleClear={handleAssignUserClear}
          />
          {!isAssignToMe && (
            <button className={styles.assignToMeModal} onClick={handleAssignToMe} type="button">
              Assign To Me
            </button>
          )}
        </Form.Item>
      </Form>
    </Modal>
  )
}
