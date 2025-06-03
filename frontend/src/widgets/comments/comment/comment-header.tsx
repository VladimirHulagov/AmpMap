import { Flex } from "antd"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { HashLink } from "react-router-hash-link"

import { UserAvatar } from "entities/user/ui"

import { DeleteComment, EditComment } from "features/comments"

import styles from "./styles.module.css"

interface Props {
  isVisibleActions: boolean
  comment: CommentType
}

export const CommentHeader = ({ isVisibleActions, comment }: Props) => {
  const { t } = useTranslation()
  const path = window.location.pathname + window.location.search

  return (
    <div className={styles.userInfo}>
      <UserAvatar size={23} avatar_link={comment.user.avatar_link} />
      <span style={{ fontWeight: 500 }}>
        {comment.user.first_name + " " + comment.user.last_name}
      </span>
      {comment.deleted_at !== null && <span className={styles.edited}> - {t("deleted")}</span>}
      {!comment.deleted_at && !dayjs(comment.updated_at).isSame(comment.created_at) && (
        <span className={styles.edited}> - {t("edited")}</span>
      )}
      <div
        style={{
          flexGrow: 1,
          height: 1,
          backgroundColor: "var(--y-grey-25)",
          margin: "0 20px",
        }}
      />
      <span>
        <HashLink
          className={styles.link}
          to={path + `#comment-${comment.id}`}
          data-testid="comment-user-info-created-at"
          style={{ marginRight: 6 }}
        >
          {dayjs(comment.created_at).format("YYYY-MM-DD HH:mm")}
        </HashLink>
      </span>
      {isVisibleActions && (
        <Flex align="start" onClick={(e) => e.stopPropagation()}>
          <DeleteComment commentId={comment.id} />
          <EditComment comment={comment} />
        </Flex>
      )}
    </div>
  )
}
