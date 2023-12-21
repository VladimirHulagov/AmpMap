import { PictureOutlined } from "@ant-design/icons"
import { Button, Checkbox, Space, Tooltip, Upload } from "antd"
import Input, { TextAreaProps } from "antd/lib/input"
import { UploadChangeParam, UploadFile } from "antd/lib/upload"
import type { UploadRequestOption } from "rc-upload/lib/interface"
import { useEffect } from "react"
import { Control, UseFormSetValue, useWatch } from "react-hook-form"

import { TestCaseStepsBlock } from "./block"
import styles from "./styles.module.css"

interface TextAreaPropsExtend extends TextAreaProps {
  name: "scenario"
}

interface UploadFileExtend<T> extends UploadFile<T> {
  link?: string
}

interface TestCaseStepsProps {
  stateAttachments: {
    attachments: IAttachmentWithUid[]
    setAttachments: React.Dispatch<React.SetStateAction<IAttachmentWithUid[]>>
  }
  stateSteps: {
    steps: Step[]
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>
  }
  setValue: UseFormSetValue<TestCaseFormData>
  control: Control<TestCaseFormData>
  customRequest: (options: UploadRequestOption<unknown>) => Promise<void>
  fieldProps: TextAreaPropsExtend
  isSteps: boolean
  setIsSteps: React.Dispatch<React.SetStateAction<boolean>>
  isEditMode: boolean
}

export const TestCaseStepsWrapper = ({
  stateAttachments,
  stateSteps,
  customRequest,
  setValue,
  fieldProps,
  control,
  isSteps,
  setIsSteps,
  isEditMode,
}: TestCaseStepsProps) => {
  const isStepsServer = useWatch({
    control,
    name: "is_steps",
  })

  const onChange = (info: UploadChangeParam<UploadFileExtend<IAttachmentWithUid[]>>) => {
    const fileList = info.fileList as IAttachmentWithUid[]
    stateAttachments.setAttachments(fileList)

    if (info.file.status === "done") {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      setValue(fieldProps.name ?? "", fieldProps.value + `![](${info.file.link})`)
    }
  }

  const toggleStepsClick = () => {
    setIsSteps(!isSteps)
    setValue("is_steps", !isSteps)
  }

  useEffect(() => {
    setIsSteps(isStepsServer ?? false)
  }, [isStepsServer])

  return (
    <>
      <div className={styles.row}>
        <Space.Compact id={`${isEditMode ? "edit" : "create"}-scenario-upload-attachment`}>
          {!isSteps && (
            <Tooltip title="Attachment">
              <Upload
                fileList={stateAttachments.attachments}
                customRequest={customRequest}
                onChange={onChange}
                name="file"
                multiple
                showUploadList={false}
              >
                <Button icon={<PictureOutlined />} size={"small"} type="link" />
              </Upload>
            </Tooltip>
          )}
        </Space.Compact>
        <Space.Compact style={{ marginLeft: "auto", marginBottom: 8 }}>
          <Checkbox
            id={`${isEditMode ? "edit" : "create"}-steps-checkbox`}
            checked={isSteps}
            onChange={toggleStepsClick}
          >
            Steps
          </Checkbox>
        </Space.Compact>
      </div>
      {!isSteps && (
        <Input.TextArea
          id={`${isEditMode ? "edit" : "create"}-scenario-textarea`}
          style={{ fontSize: 13 }}
          rows={4}
          {...fieldProps}
        />
      )}
      {isSteps && (
        <TestCaseStepsBlock
          steps={stateSteps.steps}
          setSteps={stateSteps.setSteps}
          setValue={setValue}
        />
      )}
    </>
  )
}
