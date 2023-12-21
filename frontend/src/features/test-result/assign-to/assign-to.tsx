import { UserAddOutlined } from "@ant-design/icons"
import { Button, Divider, Form, Modal, Typography } from "antd"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"
import { UserSearchInput } from "entities/user/ui/user-search-input"

import styles from "./styles.module.css"
import { useAssignTo } from "./use-assign-to"

export const AssignTo = () => {
  const {
    activeTest,
    isOpenModal,
    errors,
    isDirty,
    isLoadingUpdateTest,
    me,
    selectedUser,
    handleClose,
    handleOpenAssignModal,
    handleSubmitForm,
    handleAssignUserChange,
    handleAssignUserClear,
    handleAssignToMe,
  } = useAssignTo()

  const isAssignetMe = Number(activeTest?.assignee) === Number(me?.id)

  return (
    <>
      <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
        Assign To
      </Divider>
      <div style={{ padding: 8, marginBottom: 8 }}>
        <Typography id="test-case-assign-to">
          <div className={styles.assignBlock}>
            <UserAvatar size={32} avatar_link={activeTest?.avatar_link ?? null} />
            <Typography.Text id="test-case-assign-to-user">
              {activeTest?.assignee_username ? activeTest?.assignee_username : "Nobody"}
            </Typography.Text>
            <div className={styles.assignRow}>
              <Button
                id="assign-to-btn"
                icon={<UserAddOutlined style={{ fontSize: 14 }} />}
                key="submit"
                onClick={handleOpenAssignModal}
                type="ghost"
                size="small"
              >
                Assign To
              </Button>
              {!isAssignetMe && (
                <button className={styles.assignToMe} onClick={handleAssignToMe}>
                  Assign To Me
                </button>
              )}
            </div>
          </div>
        </Typography>
      </div>
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
            disabled={!isDirty}
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
            {!isAssignetMe && (
              <button className={styles.assignToMeModal} onClick={handleAssignToMe} type="button">
                Assign To Me
              </button>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
