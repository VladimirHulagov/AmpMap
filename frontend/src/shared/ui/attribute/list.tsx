import { ControllerRenderProps } from "react-hook-form"

import { AttributForm } from "./form"

interface AttributeListProps {
  fieldProps: ControllerRenderProps<ResultFormData, "attributes">
  attributes: Attribute[]
  handleAttributeRemove: (attributeId: string) => void
  handleAttributeChangeName: (attributeId: string, name: string) => void
  handleAttributeChangeValue: (attributeId: string, value: string) => void
  handleAttributeChangeType: (attributeId: string, type: "txt" | "list" | "json") => void
}

export const AttributeList = ({
  fieldProps,
  attributes,
  handleAttributeRemove,
  handleAttributeChangeName,
  handleAttributeChangeValue,
  handleAttributeChangeType,
}: AttributeListProps) => {
  if (attributes.length === 0) return null

  return (
    <>
      {attributes.map((attribut) => {
        return (
          <AttributForm
            key={attribut.id}
            fieldProps={fieldProps}
            attribut={attribut}
            handleAttributeRemove={handleAttributeRemove}
            handleAttributeChangeName={handleAttributeChangeName}
            handleAttributeChangeValue={handleAttributeChangeValue}
            handleAttributeChangeType={handleAttributeChangeType}
          />
        )
      })}
    </>
  )
}
