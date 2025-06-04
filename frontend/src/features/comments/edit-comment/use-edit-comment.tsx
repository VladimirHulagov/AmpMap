import { useUpdateCommentMutation } from "entities/comments/api"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { useAttachments } from "entities/attachment/model"

import { useProjectContext } from "pages/project"

import { initInternalError } from "shared/libs"
import { antdNotification } from "shared/libs/antd-modals"

export const useEditComment = (comment: CommentType) => {
  const project = useProjectContext()
  const [isShow, setIsShow] = useState(false)
  const [commentValue, setCommentValue] = useState(comment.content)

  const [updateComment, { isLoading }] = useUpdateCommentMutation()

  const { control } = useForm()
  const {
    attachments,
    isLoading: isLoadingCreateAttachment,
    onChange: handleLoadAttachmentChange,
    onRemove: handleAttachmentRemove,
    onLoad: handleAttachmentLoad,
    setAttachments,
  } = useAttachments(control, project.id)

  const handleClose = () => setIsShow(false)
  const handleShow = () => setIsShow(true)
  const handleChangeComment = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setCommentValue(e.target.value)

  const handleSaveClick = async () => {
    try {
      const attachmentsIds = attachments.map((a) => String(a.id))
      await updateComment({
        comment_id: comment.id,
        content: commentValue,
        attachments: attachmentsIds,
      })
      antdNotification.success("edit-comment", {
        description: "Success",
      })
      handleClose()
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  useEffect(() => {
    if (comment.attachments.length) {
      const attachmentsWithUid = comment.attachments.map((attach) => ({
        ...attach,
        uid: String(attach.id),
      }))

      setAttachments(attachmentsWithUid)
    }

    setCommentValue(comment.content)
  }, [comment])

  return {
    isShow,
    isLoading: isLoading || isLoadingCreateAttachment,
    commentValue,
    attachments,
    handleSaveClick,
    handleClose,
    handleShow,
    handleChangeComment,
    handleAttachmentLoad,
    handleAttachmentRemove,
    handleLoadAttachmentChange,
  }
}
