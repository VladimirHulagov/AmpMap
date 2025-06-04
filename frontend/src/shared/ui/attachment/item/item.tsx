import { CloseOutlined, CopyOutlined, FileOutlined } from "@ant-design/icons"
import { Col, Row, Space, message } from "antd"

interface AttachmentItemProps {
  attachment: IAttachment
  handleAttachmentRemove?: (fileId: number) => void
  id?: string
}

export const AttachmentItem = ({ attachment, handleAttachmentRemove, id }: AttachmentItemProps) => {
  return (
    <Row style={{ border: "1px solid var(--y-color-border)", marginBottom: 8 }} align="middle">
      <Col flex="0 1 60px" style={{ padding: "16px 16px" }}>
        <FileOutlined style={{ color: "#096dd9", fontSize: 32 }} />
      </Col>

      <Col
        flex="1 1"
        style={{
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <a
          target="blank"
          href={attachment.link}
          download={attachment.name}
          style={{ margin: 0, fontSize: 13 }}
          data-testid={id}
        >
          {attachment.name}
        </a>
      </Col>

      <Col flex="0 1 100px" style={{ textAlign: "center" }}>
        <Space>
          <CopyOutlined
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(attachment.link)
              message.info("Attachment url copied to clipboard")
            }}
            style={{ fontSize: 16, cursor: "pointer", color: "#ааа" }}
            data-testid={`attachment-copy-btn-${id}`}
          />
          {handleAttachmentRemove && (
            <CloseOutlined
              data-testid={`attachment-remove-btn-${id}`}
              onClick={() => handleAttachmentRemove(attachment.id)}
              style={{ fontSize: 16, cursor: "pointer", color: "#eb2f96" }}
            />
          )}
        </Space>
      </Col>
    </Row>
  )
}
