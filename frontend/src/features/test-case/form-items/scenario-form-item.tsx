import { Form } from "antd"
import type { UploadRequestOption } from "rc-upload/lib/interface"
import { Dispatch, SetStateAction } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { ScenarioFormLabel } from "entities/test-case/ui"

import { TextAreaWithAttach } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  type: "create" | "edit"
  isSteps: boolean
  onLoad: (options: UploadRequestOption<unknown>) => Promise<void>
  setAttachments: Dispatch<SetStateAction<IAttachmentWithUid[]>>
  attachments: IAttachmentWithUid[]
  scenarioFormErrors: string
}

export const ScenarioFormItem = ({
  type,
  isSteps,
  scenarioFormErrors,
  onLoad,
  attachments,
  setAttachments,
}: Props) => {
  const { control, setValue } = useFormContext<TestCaseFormData>()

  return (
    <Form.Item
      label={
        <ScenarioFormLabel
          type={type}
          isSteps={isSteps}
          onIsStepsChange={(toggle) => setValue("is_steps", toggle)}
        />
      }
      validateStatus={scenarioFormErrors ? "error" : ""}
      help={scenarioFormErrors}
      required
      className={styles.formItem}
    >
      <Controller
        name="scenario"
        control={control}
        render={({ field }) => (
          <TextAreaWithAttach
            uploadId={`${type}-scenario`}
            textAreaId={`${type}-scenario-textarea`}
            customRequest={onLoad}
            fieldProps={field}
            stateAttachments={{ attachments, setAttachments }}
            setValue={setValue}
          />
        )}
      />
    </Form.Item>
  )
}
