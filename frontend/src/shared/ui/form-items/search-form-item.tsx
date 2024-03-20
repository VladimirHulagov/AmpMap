import { Form } from "antd"
import { ComponentProps } from "react"
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form"

import { capitalizeFirstLetter } from "shared/libs"

import { SearchFieldImprove } from "widgets/search-field-improve"

interface Props<T extends FieldValues> {
  id?: string
  control: Control<T>
  name: Path<T>
  label?: string
  formErrors?: FieldErrors<T>
  externalErrors?: FieldValues | null
  required?: boolean
  options: ComponentProps<typeof SearchFieldImprove>
}

export const SearchFormItem = <T extends FieldValues>({
  id,
  control,
  name,
  label = capitalizeFirstLetter(name),
  formErrors,
  externalErrors,
  required = false,
  options,
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
        render={() => <SearchFieldImprove id={id} {...options} />}
      />
    </Form.Item>
  )
}
