import { CommentUserInfo } from "entities/comments/ui"
import { DeleteComment, EditComment } from "features/comments"

import { Markdown } from "shared/ui"
import { AttachmentField } from "shared/ui/attachment/field"

import styles from "./styles.module.css"

interface Props {
  comment: CommentType
  isVisibleActions: boolean
}

export const CommentMessage = ({ comment, isVisibleActions }: Props) => {
  return (
    <li className={styles.wrapper}>
      <CommentUserInfo
        username={comment.user.username}
        avatar_link={comment.user.avatar_link}
        created_at={comment.created_at}
        updated_at={comment.updated_at}
      />
      {comment.deleted_at === null ? (
        <Markdown content={comment.content} />
      ) : (
        <span style={{ fontStyle: "italic" }}>{comment.content}</span>
      )}
      <AttachmentField attachments={comment.attachments} isDivider={false} />
      {isVisibleActions && (
        <div className={styles.actions}>
          <EditComment comment={comment} />
          <DeleteComment commentId={comment.id} />
        </div>
      )}
    </li>
  )
}
