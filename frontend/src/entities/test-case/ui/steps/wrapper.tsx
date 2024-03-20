import { Checkbox, Space } from "antd"
import { TextAreaProps } from "antd/lib/input"
import type { UploadRequestOption } from "rc-upload/lib/interface"
import { useEffect } from "react"
import { Control, UseFormClearErrors, UseFormSetValue, useWatch } from "react-hook-form"

import { TextAreaWithAttach } from "shared/ui"

import { TestCaseStepsBlock } from "./block"
import styles from "./styles.module.css"

interface TextAreaPropsExtend extends TextAreaProps {
  name: "scenario"
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
  clearErrors: UseFormClearErrors<TestCaseFormData>
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
  clearErrors,
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

  const toggleStepsClick = () => {
    clearErrors(isSteps ? "steps" : "scenario")
    setIsSteps(!isSteps)
    setValue("is_steps", !isSteps)
  }

  useEffect(() => {
    setIsSteps(isStepsServer ?? false)
  }, [isStepsServer])

  return (
    <>
      <div className={styles.row}>
        <Space.Compact style={{ marginLeft: "auto", marginBottom: 8 }} className={styles.checkbox}>
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
        <TextAreaWithAttach
          uploadId={`${isEditMode ? "edit" : "create"}-scenario`}
          textAreaId={`${isEditMode ? "edit" : "create"}-scenario-textarea`}
          customRequest={customRequest}
          fieldProps={fieldProps}
          stateAttachments={{
            attachments: stateAttachments.attachments,
            setAttachments: stateAttachments.setAttachments,
          }}
          setValue={setValue}
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
