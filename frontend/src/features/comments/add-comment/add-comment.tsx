import { UploadOutlined } from "@ant-design/icons"
import { Button, Input, Upload } from "antd"

import { Attachment } from "shared/ui"

import { useAddComment } from "./use-add-comment"

interface Props {
  model: Models
  object_id: string
  setIsShowAdd: (value: boolean) => void
}

export const AddComment = ({ model, object_id, setIsShowAdd }: Props) => {
  const {
    comment,
    attachments,
    isLoadingAddComment,
    isLoadingCreateAttachment,
    setComment,
    handleAddClick,
    handleAttachmentRemove,
    handleLoadAttachmentChange,
    handleAttachmentLoad,
  } = useAddComment({ setIsShowAdd, model, object_id })

  return (
    <div style={{ marginTop: 12, gap: 12, display: "flex", flexDirection: "column" }}>
      <Input.TextArea
        id="add-comments-text-area"
        style={{ fontSize: 13 }}
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Type a comment"
        autoFocus
      />
      <Attachment.List
        handleAttachmentRemove={handleAttachmentRemove}
        attachments={attachments}
        isShowNoAttachment={false}
      />
      <div style={{ display: "flex", alignItems: "center" }}>
        <Upload
          showUploadList={false}
          onChange={handleLoadAttachmentChange}
          customRequest={handleAttachmentLoad}
        >
          <Button icon={<UploadOutlined />}>Upload file</Button>
        </Upload>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginLeft: "auto" }}>
          <Button
            id="add-comment-btn"
            type="primary"
            onClick={handleAddClick}
            loading={isLoadingAddComment || isLoadingCreateAttachment}
            disabled={!comment.length}
          >
            Add
          </Button>
          <Button id="cancel-comment-btn" onClick={() => setIsShowAdd(false)} type="ghost">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
