import { useState } from "react"
import { UseFormSetValue } from "react-hook-form"

interface UseAttributesProps {
  setValue: UseFormSetValue<ResultFormData>
}

export const useAttributes = ({ setValue }: UseAttributesProps) => {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeCounter, setAttributeCounter] = useState(0)

  const addAttribute = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    setAttributeCounter(attributeCounter + 1)

    const newAttributes = [
      ...attributes,
      { id: String(attributeCounter + 1), name: "", value: "", type: "txt" },
    ] as Attribute[]
    setAttributes(newAttributes)
    setValue("attributes", newAttributes, { shouldDirty: true })
  }

  const onAttributeRemove = (attributeId: string) => {
    const newAttributes = attributes.filter(({ id }: Attribute) => id !== attributeId)
    setAttributes(newAttributes)
    setValue("attributes", newAttributes, { shouldDirty: true })
  }

  const onAttributeChangeName = (attributeId: string, name: string) => {
    const newAttributes = attributes.map((attribute) => {
      if (attribute.id !== attributeId) return attribute
      return {
        ...attribute,
        name,
      }
    })
    setAttributes(newAttributes)
    setValue("attributes", newAttributes, { shouldDirty: true })
  }

  const onAttributeChangeValue = (attributeId: string, value: string) => {
    const newAttributes = attributes.map((attribute) => {
      if (attribute.id !== attributeId) return attribute
      return {
        ...attribute,
        value,
      }
    })
    setAttributes(newAttributes)
    setValue("attributes", newAttributes, { shouldDirty: true })
  }

  const onAttributeChangeType = (attributeId: string, type: "txt" | "list" | "json") => {
    const newAttributes = attributes.map((attribute) => {
      if (attribute.id !== attributeId) return attribute
      return {
        ...attribute,
        type,
      }
    })
    setAttributes(newAttributes)
    setValue("attributes", newAttributes, { shouldDirty: true })
  }

  return {
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    addAttribute,
    setAttributes,
    attributes,
  }
}
