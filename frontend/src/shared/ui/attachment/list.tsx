import { useTranslation } from "react-i18next"

import { AttachmentItem } from "./item/item"
import { AttachmentItemMin } from "./item/item-min"
import styles from "./styles.module.css"

interface AttachmentListProps {
  attachments: IAttachment[]
  handleAttachmentRemove?: (fileId: number) => void
  isShowNoAttachment?: boolean
  isMin?: boolean
  id?: string
}

export const AttachmentList = ({
  attachments,
  isShowNoAttachment = true,
  handleAttachmentRemove,
  isMin = false,
  id,
}: AttachmentListProps) => {
  const { t } = useTranslation()
  if (attachments.length === 0 && isShowNoAttachment) return <p>{t("No attachments")}</p>

  const AttachmentComponent = isMin ? AttachmentItemMin : AttachmentItem

  return (
    <ul data-testid={`${id}-attachment-list`} className={styles.attachmentList}>
      {attachments.map((attachment, index) => (
        <AttachmentComponent
          key={`${attachment.id}-${index}`}
          handleAttachmentRemove={handleAttachmentRemove}
          attachment={attachment}
          id={`${id}-attach-${attachment.name}`}
        />
      ))}
    </ul>
  )
}
