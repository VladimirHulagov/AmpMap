import { CloseOutlined, CopyOutlined } from "@ant-design/icons"
import { Col, Row, Space, message } from "antd"

import FileLinear from "shared/assets/yi-icons/file-linear.svg?react"

import styles from "./styles.module.css"

interface AttachmentItemProps {
  attachment: IAttachment
  handleAttachmentRemove?: (fileId: number) => void
  id?: string
}

export const AttachmentItemMin = ({
  attachment,
  handleAttachmentRemove,
  id,
}: AttachmentItemProps) => {
  return (
    <Row className={styles.row} align="middle">
      <FileLinear className={styles.fileIcon} />
      <Col flex="1 1" className={styles.nameBlock}>
        <span className={styles.name} data-testid={id}>
          {attachment.name}
        </span>
      </Col>

      <Col flex="0 1">
        <Space>
          <CopyOutlined
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(attachment.link)
              message.info("Attachment url copied to clipboard")
            }}
            className={styles.copyBtn}
            data-testid={`attachment-copy-btn-${id}`}
          />
          {handleAttachmentRemove && (
            <CloseOutlined
              data-testid={`attachment-remove-btn-${id}`}
              onClick={() => handleAttachmentRemove(attachment.id)}
              className={styles.removeBtn}
            />
          )}
        </Space>
      </Col>
    </Row>
  )
}
