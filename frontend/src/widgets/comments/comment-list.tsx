import { useAppSelector } from "app/hooks"

import { selectUser } from "entities/auth/model"

import { CommentMessage } from "./comment-message/comment-message"

interface Props {
  comments: CommentType[]
}

export const CommentList = ({ comments }: Props) => {
  const user = useAppSelector(selectUser)

  return (
    <ul style={{ paddingLeft: 8 }}>
      {comments.map((comment, index) => {
        const isVisibleActions =
          Number(comment.user.id) === Number(user?.id) && comment.deleted_at === null
        return <CommentMessage key={index} comment={comment} isVisibleActions={isVisibleActions} />
      })}
    </ul>
  )
}
