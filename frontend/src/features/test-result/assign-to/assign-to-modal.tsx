import { Form, Modal } from "antd"
import { useTranslation } from "react-i18next"

import { UserSearchInput } from "entities/user/ui"

import { useProjectContext } from "pages/project"

import { Button } from "shared/ui"

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

const TEST_ID = "assign-to"

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
  const { t } = useTranslation()
  const project = useProjectContext()

  return (
    <Modal
      bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
      wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
      title={<span data-testid={`${TEST_ID}-modal-title`}>{t("Assign To")}</span>}
      open={isOpenModal}
      onCancel={handleClose}
      footer={[
        <Button
          data-testid={`${TEST_ID}-modal-cancel-button`}
          key="back"
          onClick={handleClose}
          color="secondary-linear"
        >
          {t("Cancel")}
        </Button>,
        <Button
          data-testid={`${TEST_ID}-modal-save-button`}
          key="submit"
          color="accent"
          onClick={handleSubmitForm}
          disabled={!isDirty && !!selectedUser}
          loading={isLoadingUpdateTest}
        >
          {t("Save")}
        </Button>,
      ]}
    >
      <Form id="test-assign-form" layout="vertical" onFinish={handleSubmitForm}>
        <Form.Item
          label={t("Name")}
          validateStatus={errors?.assignUserId ? "error" : ""}
          help={errors?.assignUserId ?? ""}
        >
          <UserSearchInput
            selectedUser={selectedUser}
            handleChange={handleAssignUserChange}
            handleClear={handleAssignUserClear}
            project={project}
          />
          {!isAssignToMe && (
            <button className={styles.assignToMeModal} onClick={handleAssignToMe} type="button">
              {t("Assign To Me")}
            </button>
          )}
          <button
            className={styles.assignToMeModal}
            onClick={() => {
              handleAssignUserClear()
              handleSubmitForm()
            }}
            type="button"
          >
            {t("Unassign")}
          </button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
