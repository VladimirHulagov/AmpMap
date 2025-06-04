import { Form, Select } from "antd"
import { Control, Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Status } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  control: Control<AddBulkResultFormData, number>
  statuses: Status[]
  isLoading?: boolean
  error?: string
}

export const StatusStepBody = ({ control, statuses, error, isLoading }: Props) => {
  const { t } = useTranslation()

  return (
    <Form.Item
      label={t("Status")}
      required
      help={
        <div style={{ marginTop: 4, marginLeft: 4 }} className={styles.errorText}>
          {error}
        </div>
      }
    >
      <Controller
        name="status"
        control={control}
        rules={{ required: { value: true, message: t("Required field") } }}
        render={({ field, fieldState: { error: formError } }) => (
          <Select
            {...field}
            placeholder={t("Please select")}
            style={{ width: "100%" }}
            id="create-bulk-result-status"
            status={formError && "error"}
            loading={isLoading}
          >
            {statuses.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                <Status
                  id={status.id}
                  name={status.name}
                  color={status.color}
                  extraId="create-bulk-result"
                />
              </Select.Option>
            ))}
          </Select>
        )}
      />
    </Form.Item>
  )
}
