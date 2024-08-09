import { UserAddOutlined } from "@ant-design/icons"
import { Button, Divider, Typography } from "antd"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { AssingToModal } from "./assign-to-modal"
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
                type="text"
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
      <AssingToModal
        isOpenModal={isOpenModal}
        errors={errors}
        isDirty={isDirty}
        isLoadingUpdateTest={isLoadingUpdateTest}
        selectedUser={selectedUser}
        handleClose={handleClose}
        handleOpenAssignModal={handleOpenAssignModal}
        handleSubmitForm={handleSubmitForm}
        handleAssignUserChange={handleAssignUserChange}
        handleAssignUserClear={handleAssignUserClear}
        handleAssignToMe={handleAssignToMe}
        isAssignToMe={isAssignetMe}
      />
    </>
  )
}
