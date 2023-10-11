import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { Button, Modal, notification } from "antd"
import { useDeleteCommentMutation } from "entities/comments/api"

export const DeleteComment = ({ commentId }: { commentId: number }) => {
  const [deleteComment] = useDeleteCommentMutation()

  const handleDelete = async () => {
    try {
      await deleteComment(commentId).unwrap()
      notification.success({
        message: "Success",
        description: "Comment deleted successfully",
      })
    } catch (err: unknown) {
      const error = err as FetchBaseQueryError
      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }
  }

  return (
    <Button
      id="delete-comment"
      type="link"
      style={{
        border: "none",
        padding: 0,
        height: "auto",
        lineHeight: 1,
      }}
      onClick={() => {
        Modal.confirm({
          title: "Do you want to delete this comment?",
          okText: "Delete",
          cancelText: "Cancel",
          onOk: handleDelete,
        })
      }}
    >
      <span style={{ textDecoration: "underline" }}>Delete</span>
    </Button>
  )
}
