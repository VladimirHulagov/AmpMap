import { PaperClipOutlined } from "@ant-design/icons"
import { UploadChangeParam } from "antd/es/upload"
import { Upload, UploadFile } from "antd/lib"
import classNames from "classnames"
import type { UploadRequestOption } from "rc-upload/lib/interface"
import React from "react"
import { useTranslation } from "react-i18next"

import { AttachmentList } from "../list"
import styles from "./styles.module.css"

interface UploadFileExtend<T> extends UploadFile<T> {
  id?: number
  link?: string
}

interface Props {
  onRemove: (fileId: number) => void
  onLoad: (options: UploadRequestOption<unknown>) => Promise<void>
  onChange: (info: UploadChangeParam<UploadFileExtend<IAttachmentWithUid[]>>) => void
  attachments: IAttachmentWithUid[]
  attachmentsIds: Record<"id", string>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  registerKey?: (index: number) => string
  id?: string
  className?: string
  style?: React.CSSProperties
}

export const AttachmentDropFilesMin = ({
  attachments,
  attachmentsIds,
  onChange,
  onLoad,
  onRemove,
  register,
  registerKey,
  id,
  className,
  style,
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className={className} style={style}>
      <AttachmentList
        handleAttachmentRemove={onRemove}
        attachments={attachments}
        isShowNoAttachment={false}
        isMin
        id={id}
      />
      {attachmentsIds.map((field, index) => (
        <input
          type="hidden"
          key={field.id}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          {...register(registerKey ? registerKey(index) : `attachments.${index}`)}
        />
      ))}
      <Upload
        fileList={attachments}
        onChange={onChange}
        customRequest={onLoad}
        showUploadList={false}
        data-testid={`${id}-input`}
      >
        <label
          className={classNames(styles.fileUpload, { [styles.hasAttachments]: attachments.length })}
          data-testid={`${id}-file-upload`}
        >
          <div className={styles.fileUploadIconBlock}>
            <PaperClipOutlined />
          </div>
          <span style={{ color: "var(--y-color-text-primary)" }}>{t("Attachment")}</span>
        </label>
      </Upload>
    </div>
  )
}
