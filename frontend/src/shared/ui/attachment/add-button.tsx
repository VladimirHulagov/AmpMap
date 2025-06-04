import { PlusOutlined } from "@ant-design/icons"
import { Button, Flex, Upload } from "antd"
import { UploadChangeParam } from "antd/es/upload"
import { UploadFile } from "antd/lib"
import type { UploadRequestOption } from "rc-upload/lib/interface"
import { useTranslation } from "react-i18next"

import { AttachmentList } from "./list"
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
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
}

export const AddAttachmentButton = ({
  attachments,
  attachmentsIds,
  onChange,
  onLoad,
  onRemove,
  register,
  id,
}: Props) => {
  const { t } = useTranslation()
  return (
    <div>
      <AttachmentList handleAttachmentRemove={onRemove} attachments={attachments} id={id} />
      <Button id={`${id}-add-btn`} block className={styles.addButton}>
        <Upload
          multiple
          showUploadList={false}
          customRequest={onLoad}
          onChange={onChange}
          fileList={attachments}
          data-testid={`${id}-add-attach-input`}
        >
          <span className={styles.addButtonContent}>
            <Flex align="center" justify="center" style={{ height: "100%" }} gap={4}>
              <PlusOutlined /> {t("Add Attachment")}
            </Flex>
          </span>
        </Upload>
      </Button>
      {attachmentsIds.map((field, index) => (
        <input
          type="hidden"
          key={field.id}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          {...register(`attachments.${index}`)}
        />
      ))}
    </div>
  )
}
