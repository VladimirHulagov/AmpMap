import { Typography } from "antd"
import { useTranslation } from "react-i18next"

import "entities/user/ui"
import { UserSearchPopover } from "entities/user/ui"
import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { useProjectContext } from "pages/project"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"

import styles from "./styles.module.css"
import { useAssignTo } from "./use-assign-to"

interface Props {
  onSuccess?: () => void
  canChange?: boolean
}

export const AssignTo = ({ onSuccess, canChange = true }: Props) => {
  const { t } = useTranslation()
  const {
    activeTest,
    isDirty,
    isLoadingUpdateTest,
    me,
    selectedUser,
    isOpen,
    handleClose,
    handleOpenAssignModal,
    handleSubmitForm,
    handleAssignUserChange,
    handleAssignUserClear,
    handleAssignToMe,
  } = useAssignTo({ onSuccess })
  const project = useProjectContext()

  const isAssigneMe = Number(activeTest?.assignee) === Number(me?.id)

  return (
    <>
      <div>
        <span className={styles.label}>{t("Assignee")}</span>
        {!isAssigneMe && canChange && (
          <span
            data-testid="test-detail-assign-to-me"
            onClick={handleAssignToMe}
            className={styles.assignToMe}
          >
            {t("Assign To Me")}
          </span>
        )}
      </div>
      <UserSearchPopover
        project={project}
        isOpen={isOpen}
        activeTest={activeTest}
        onClose={handleClose}
        onOpen={handleOpenAssignModal}
        selectedUser={selectedUser}
        onChange={handleAssignUserChange}
        onClear={handleAssignUserClear}
        onSubmitForm={handleSubmitForm}
        onAssignToMe={handleAssignToMe}
        isAssigenMe={isAssigneMe}
        isDirty={isDirty}
        isLoadingUpdate={isLoadingUpdateTest}
        canChange={canChange}
        label={
          <div
            style={{ marginTop: 8, cursor: canChange ? "pointer" : undefined, userSelect: "none" }}
          >
            <Typography id="test-case-assign-to">
              <div className={styles.assignBlock} onClick={handleOpenAssignModal}>
                <UserAvatar size={32} avatar_link={activeTest?.avatar_link ?? null} />
                <Typography.Text id="test-case-assign-to-user">
                  {activeTest?.assignee_username ? activeTest?.assignee_username : t("Nobody")}
                </Typography.Text>
                {canChange && (
                  <ArrowIcon width={16} height={16} className={styles.arrow} id="assign-to-btn" />
                )}
              </div>
            </Typography>
          </div>
        }
      />
    </>
  )
}
