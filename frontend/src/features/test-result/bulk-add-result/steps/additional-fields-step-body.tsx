import { Form } from "antd"
import { Control, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useAttachments } from "entities/attachment/model"

import { Attachment, TextAreaFormItem } from "shared/ui"

interface Props<T extends FieldValues> {
  control: Control<T>
  projectId: number
  name: Path<T>
  formErrors?: FieldErrors<T>
  register?: UseFormRegister<T>
}

export const AdditionalFieldsStepBody = <T extends FieldValues>({
  control,
  formErrors,
  projectId,
  name,
  register,
}: Props<T>) => {
  const { t } = useTranslation()
  const { attachments, onChange, attachmentsIds, onLoad, onRemove } = useAttachments<T>(
    control,
    projectId
  )

  return (
    <>
      <TextAreaFormItem
        control={control}
        name={name}
        label={t("Comment")}
        id="add-bulk-result-comment"
        formErrors={formErrors}
        rows={3}
      />
      <Form.Item label={t("Attachment")}>
        <Attachment.AddButton
          attachments={attachments}
          attachmentsIds={attachmentsIds}
          onChange={onChange}
          onLoad={onLoad}
          onRemove={onRemove}
          register={register}
          id="add-bulk-result-attachment"
        />
      </Form.Item>
    </>
  )
}
