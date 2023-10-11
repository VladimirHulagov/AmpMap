import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { notification } from "antd"
import { useAddCommentMutation } from "entities/comments/api"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

interface Props {
  model: Models
  object_id: string
  setIsShowAdd: (value: boolean) => void
}

export const useAddComment = ({ setIsShowAdd, model, object_id }: Props) => {
  const { projectId } = useParams<ParamProjectId>()
  const [comment, setComment] = useState("")
  const [addComment, { isLoading: isLoadingAddComment }] = useAddCommentMutation()
  const { control } = useForm()
  const {
    attachments,
    isLoading: isLoadingCreateAttachment,
    onChange: handleLoadAttachmentChange,
    onRemove: handleAttachmentRemove,
    onLoad: handleAttachmentLoad,
  } = useAttachments(control, projectId)

  const handleAddClick = async () => {
    const attachmentsIds = attachments.map((attach) => String(attach.id))
    try {
      await addComment({ model, object_id, content: comment, attachments: attachmentsIds })
      notification.success({
        message: "Success",
      })
      setComment("")
      setIsShowAdd(false)
    } catch (err: unknown) {
      const error = err as FetchBaseQueryError

      console.error(error)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }
  }

  return {
    isLoadingAddComment,
    isLoadingCreateAttachment,
    attachments,
    comment,
    handleAddClick,
    handleAttachmentRemove,
    handleAttachmentLoad,
    handleLoadAttachmentChange,
    setComment,
  }
}
