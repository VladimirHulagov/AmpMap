import { selectOpenedComments } from "entities/comments/model/slice"

import { useAppSelector } from "app/hooks"

import { selectUser } from "entities/auth/model"

import { Comment } from "./comment"

interface Props {
  comments: CommentType[]
}

export const CommentList = ({ comments }: Props) => {
  const user = useAppSelector(selectUser)
  const openedComments = useAppSelector(selectOpenedComments)

  return (
    <ul data-testid="comment-list">
      {comments.map((comment, index) => {
        const isVisibleActions =
          Number(comment.user.id) === Number(user?.id) && comment.deleted_at === null

        const shouldOpen = !openedComments.includes(comment.id) && index === 0

        return (
          <Comment
            key={comment.id}
            comment={comment}
            isVisibleActions={isVisibleActions}
            isOpen={openedComments.includes(comment.id) || shouldOpen}
          />
        )
      })}
    </ul>
  )
}
