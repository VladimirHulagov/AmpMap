import { Form, Input } from "antd"
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form"

import { capitalizeFirstLetter } from "shared/libs"

interface Props<T extends FieldValues> {
  id: string
  control: Control<T>
  name: Path<T>
  label?: string
  formErrors?: FieldErrors<T>
  externalErrors?: FieldValues | null
  required?: boolean
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >
  maxLength?: number
}

export const InputFormItem = <T extends FieldValues>({
  id,
  control,
  name,
  formErrors,
  externalErrors,
  rules,
  maxLength,
  label = capitalizeFirstLetter(name),
  required = false,
}: Props<T>) => {
  const errors = (
    formErrors ? formErrors[name]?.message : externalErrors ? externalErrors[name] : undefined
  ) as string | undefined

  return (
    <Form.Item
      label={label}
      validateStatus={errors ? "error" : ""}
      help={errors}
      required={required}
    >
      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? { value: true, message: "Обязательное поле." } : undefined,
          maxLength: maxLength
            ? { value: maxLength, message: "Максимальная длина " + maxLength }
            : undefined,
          ...rules,
        }}
        render={({ field }) => <Input id={id} {...field} />}
      />
    </Form.Item>
  )
}
