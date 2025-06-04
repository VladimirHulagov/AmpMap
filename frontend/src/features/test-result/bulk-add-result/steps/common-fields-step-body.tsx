import { Control, FieldArrayWithId } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { getCommonFieldPath } from "../use-create-bulk-result-modal"
import { FieldFormItem } from "./field-form-item"

interface Props {
  fields: FieldArrayWithId<AddBulkResultFormData, "non_suite_specific", "id">[]
  control: Control<AddBulkResultFormData, string>
  errors: string[]
}

export const CommonFieldsStepBody = ({ fields, control, errors }: Props) => {
  const { t } = useTranslation()

  if (fields.length === 0) {
    return <div data-testid="no-common-fields">{t("No common fields")}</div>
  }

  return (
    <ul style={{ margin: 0 }}>
      {fields.map((item, index) => {
        const id = `common-field-${item.label}`.replace(/[^a-zA-Zа-яА-Я0-9-_]/g, "-")
        return (
          <li key={item.id} style={{ listStyleType: "none" }}>
            <FieldFormItem
              label={item.label}
              required={item.is_required}
              errorText={errors[index]}
              control={control}
              name={getCommonFieldPath(index)}
              id={id}
            />
          </li>
        )
      })}
    </ul>
  )
}
