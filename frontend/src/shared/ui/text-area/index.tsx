import { PictureOutlined } from "@ant-design/icons"
import { Button, Input, Space, Tooltip, Upload } from "antd"
import { TextAreaProps } from "antd/lib/input/TextArea"
import type { UploadRequestOption } from "rc-upload/lib/interface"
import { UseFormSetValue } from "react-hook-form"

interface TSTextAreaProps {
  uploadId?: string
  textAreaId?: string
  fieldProps: TextAreaProps
  stateAttachments: {
    attachments: IAttachmentWithUid[]
    setAttachments: React.Dispatch<React.SetStateAction<IAttachmentWithUid[]>>
  }
  customRequest: (options: UploadRequestOption<unknown>) => Promise<void>
  // TODO fix it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
}

export const TextArea = ({
  uploadId,
  textAreaId,
  fieldProps,
  stateAttachments,
  customRequest,
  setValue,
}: TSTextAreaProps) => {
  const { attachments, setAttachments } = stateAttachments

  // TODO fix it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChange = (info: any) => {
    setAttachments(info.fileList)

    const { status } = info.file
    if (status === "done") {
      setValue(fieldProps.name || "", fieldProps.value + `![](${info.file.link})`, {
        shouldDirty: true,
      })
    }
  }

  return (
    <>
      <Space.Compact id={`${uploadId}-upload-attachment`}>
        <Tooltip title="Attachment">
          <Upload
            id={`${uploadId}-upload-attachment-input`}
            fileList={attachments}
            customRequest={customRequest}
            onChange={onChange}
            name="file"
            multiple
            showUploadList={false}
          >
            <Button id="upload-attachment" icon={<PictureOutlined />} size={"small"} type="link" />
          </Upload>
        </Tooltip>
      </Space.Compact>
      <Input.TextArea id={textAreaId} style={{ fontSize: 13 }} rows={4} {...fieldProps} />
    </>
  )
}
