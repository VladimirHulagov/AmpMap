import { FileOutlined } from "@ant-design/icons"
import { Col, Divider, Row } from "antd"
import { useTranslation } from "react-i18next"

import styles from "./styles.module.css"

interface IAttachmentsFieldProps {
  attachments: IAttachment[]
  isDivider?: boolean
  isShowNoAttachment?: boolean
  showTitle?: boolean
}

export const AttachmentField = ({
  attachments,
  isShowNoAttachment = false,
  isDivider = true,
  showTitle = true,
}: IAttachmentsFieldProps) => {
  const { t } = useTranslation()
  if (attachments.length === 0 && isShowNoAttachment) return <p>{t("No attachments")}</p>
  return (
    <>
      {showTitle &&
        (isDivider ? (
          <Divider orientation="left" className={styles.dividerLabel}>
            {t("Attachments")}
          </Divider>
        ) : (
          <div className={styles.label}> {t("Attachments")}</div>
        ))}
      {attachments.map((attachment, index) => {
        return (
          <Row align="middle" key={attachment.id} id={`attachment-${index + 1}`}>
            <Col flex="0 1 40px" style={{ padding: 8 }}>
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
              <a target="blank" href={attachment.link} style={{ margin: 0, fontSize: 13 }}>
                {attachment.filename}
              </a>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#828282",
                }}
              >
                {attachment.size_humanize}
              </p>
            </Col>
          </Row>
        )
      })}
    </>
  )
}
