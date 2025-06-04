import { Form } from "antd"
import { Control, Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TextArea } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  label: string
  required: boolean
  errorText: string
  control: Control<AddBulkResultFormData, string>
  name: CommonFieldPath | SuiteSpecificFieldPath | BulkSuiteSpecificFieldPath
  id?: string
}

export const FieldFormItem = ({ label, required, control, errorText, name, id }: Props) => {
  const { t } = useTranslation()
  return (
    <Form.Item
      label={label}
      required={required}
      help={
        <div style={{ marginTop: 4, marginLeft: 4 }} className={styles.errorText}>
          {errorText}
        </div>
      }
    >
      <Controller
        control={control}
        name={name}
        rules={{ required: { value: required, message: t("Required field") } }}
        render={({ field, fieldState: { error } }) => {
          return (
            <TextArea
              value={field.value}
              onChange={field.onChange}
              status={error && "error"}
              rows={1}
              id={id}
              onKeyDown={(e) => {
                const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]
                if (arrowKeys.includes(e.key)) {
                  e.stopPropagation()
                }
              }}
            />
          )
        }}
      />
    </Form.Item>
  )
}
