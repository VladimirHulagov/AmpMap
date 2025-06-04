import { Popconfirm, Tooltip } from "antd"
import { PopconfirmProps } from "antd/lib"
import classNames from "classnames"
import { useDeleteCommentMutation } from "entities/comments/api"
import { useTranslation } from "react-i18next"

import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import { initInternalError } from "shared/libs"
import { antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  commentId: number
}

const TEST_ID = "delete-comment"

export const DeleteComment = ({ commentId }: Props) => {
  const { t } = useTranslation()
  const [deleteComment] = useDeleteCommentMutation()

  const handleDelete = async () => {
    try {
      await deleteComment(commentId).unwrap()
      antdNotification.success("delete-comment", {
        description: t("Comment deleted successfully"),
      })
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  const handleConfirm: PopconfirmProps["onConfirm"] = () => {
    handleDelete()
  }

  return (
    <>
      <Tooltip title={t("Delete comment")}>
        <Popconfirm
          id={`${TEST_ID}-popconfirm`}
          placement="topRight"
          title={t("Delete the comment")}
          description={t("Are you sure to delete this comment?")}
          onConfirm={handleConfirm}
          okText={t("Yes")}
          cancelText={t("No")}
          okButtonProps={{ "data-testid": `${TEST_ID}-ok-button` }}
          cancelButtonProps={{ "data-testid": `${TEST_ID}-cancel-button` }}
        >
          <Button
            id={`comment-${commentId}-delete`}
            className={styles.actionButton}
            size="s"
            color="ghost"
            onClick={(e) => {
              e.stopPropagation()
            }}
            icon={
              <DeleteIcon
                width={20}
                height={20}
                className={classNames(styles.actionIcon, styles.deleteActionIcon)}
                data-testid={`${TEST_ID}-${commentId}`}
              />
            }
          />
        </Popconfirm>
      </Tooltip>
    </>
  )
}
