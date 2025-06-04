import { EditOutlined, UploadOutlined } from "@ant-design/icons"
import { Modal, Tooltip, Upload } from "antd"
import { useTranslation } from "react-i18next"

import { Attachment, Button, TextArea } from "shared/ui"

import styles from "./styles.module.css"
import { useEditComment } from "./use-edit-comment"

interface Props {
  comment: CommentType
}

const TEST_ID = "edit-comment"

export const EditComment = ({ comment }: Props) => {
  const { t } = useTranslation()
  const {
    isShow,
    isLoading,
    commentValue,
    attachments,
    handleShow,
    handleClose,
    handleSaveClick,
    handleChangeComment,
    handleAttachmentRemove,
    handleAttachmentLoad,
    handleLoadAttachmentChange,
  } = useEditComment(comment)

  return (
    <>
      <Tooltip title={t("Edit comment")}>
        <Button
          id="edit-comment"
          size="s"
          color="ghost"
          onClick={handleShow}
          className={styles.actionButton}
          icon={
            <EditOutlined
              className={styles.actionIcon}
              data-testid={`edit-comment-${comment.id}`}
            />
          }
          data-testid={`${TEST_ID}-modal-button`}
        />
      </Tooltip>

      <Modal
        bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
        wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
        title={<span data-testid={`${TEST_ID}-modal-title`}>{t("Edit comment")}</span>}
        open={isShow}
        onCancel={handleClose}
        footer={[
          <Button
            key="back"
            onClick={handleClose}
            color="secondary"
            id={`cancel-editing-comment-${comment.id}`}
            data-testid={`${TEST_ID}-modal-cancel-button`}
          >
            {t("Cancel")}
          </Button>,
          <Button
            key="submit"
            color="accent"
            onClick={handleSaveClick}
            loading={isLoading}
            disabled={!commentValue.length}
            id={`submit-editing-comment-${comment.id}`}
            data-testid={`${TEST_ID}-modal-submit-button`}
          >
            {t("Save")}
          </Button>,
        ]}
      >
        <TextArea
          id="edit-comments-text-area"
          rootClassName={styles.commentText}
          rows={4}
          value={commentValue}
          onChange={handleChangeComment}
        />
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: attachments.length ? 12 : 0 }}>
            <Upload
              showUploadList={false}
              onChange={handleLoadAttachmentChange}
              customRequest={handleAttachmentLoad}
            >
              <Button icon={<UploadOutlined />} data-testid={`${TEST_ID}-modal-upload-button`}>
                {t("Upload file")}
              </Button>
            </Upload>
          </div>
          <Attachment.List
            handleAttachmentRemove={handleAttachmentRemove}
            attachments={attachments}
            isShowNoAttachment={false}
            id="edit-comment"
          />
        </div>
      </Modal>
    </>
  )
}
