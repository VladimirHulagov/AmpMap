import { Form } from "antd"
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form"

import { capitalizeFirstLetter } from "shared/libs"

import { SearchField } from "widgets/search-field"

interface WorkData {
  id: number
  name: string
}

interface Props<T extends FieldValues> {
  id?: string
  control: Control<T>
  name: Path<T>
  label?: string
  placeholder?: string
  valueKey?: "name" | "title"
  formErrors?: FieldErrors<T>
  externalErrors?: FieldValues | null
  required?: boolean
  options: {
    selectedParent: SelectData | null
    data: WorkData[]
    isLoading: boolean
    isLastPage: boolean
    onClear: () => void
    onSearch: (value?: string | undefined) => void
    onChange: (dataValue?: SelectData | undefined) => void
    onLoadNextPageData: () => void
  }
}

export const SearchFormItemOld = <T extends FieldValues>({
  id,
  control,
  name,
  label = capitalizeFirstLetter(name),
  placeholder,
  valueKey,
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
        render={() => (
          <SearchField
            id={id}
            select={options.selectedParent}
            data={options.data}
            isLoading={options.isLoading}
            isLastPage={options.isLastPage}
            onClear={options.onClear}
            onSearch={options.onSearch}
            onChange={options.onChange}
            handleLoadNextPageData={options.onLoadNextPageData}
            placeholder={placeholder}
            valueKey={valueKey}
          />
        )}
      />
    </Form.Item>
  )
}
