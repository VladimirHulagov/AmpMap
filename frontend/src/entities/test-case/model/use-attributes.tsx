import { useAttributesTestCase } from "entities/custom-attribute/model"
import { useEffect, useState } from "react"
import { UseFormSetValue } from "react-hook-form"

import { makeRandomId } from "shared/libs"

interface UseAttributesProps {
  mode: "create" | "edit"
  setValue: UseFormSetValue<TestCaseFormData>
}

export const useAttributes = ({ mode, setValue }: UseAttributesProps) => {
  const [attributes, setAttributes] = useState<Attribute[]>([])

  const { attributes: attributesTestCase, isLoading: isLoadingAttributesTestCase } =
    useAttributesTestCase()

  useEffect(() => {
    if (mode === "create" && attributesTestCase) {
      setAttributes(attributesTestCase)
    }
  }, [mode, attributesTestCase])

  const addAttribute = () => {
    const newAttributes = [
      ...attributes,
      { id: makeRandomId(), name: "", value: "", type: "Text" },
    ] as Attribute[]
    setAttributes(newAttributes)
    setValue("attributes", newAttributes, { shouldDirty: true })
  }

  const onAttributeRemove = (attributeId: string) => {
    const newAttributes = attributes.filter((item: Attribute) => item.id !== attributeId)
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

  const onAttributeChangeType = (attributeId: string, type: AttributeType) => {
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

  const resetAttributes = () => {
    setAttributes(mode === "create" ? attributesTestCase : [])
  }

  const loadAttributeJson = (attributesJson: AttributesObject) => {
    const newAttributes: Attribute[] = []

    Object.keys(attributesJson).map((key: string) => {
      if (typeof attributesJson[key] === "string") {
        newAttributes.push({
          id: makeRandomId(),
          name: key,
          type: "Text",
          value: attributesJson[key],
          required: false,
        })
      } else if (Array.isArray(attributesJson[key])) {
        const array: string[] = attributesJson[key] as string[]
        newAttributes.push({
          id: makeRandomId(),
          name: key,
          type: "List",
          value: array.join("\r\n"),
          required: false,
        })
      } else if (typeof attributesJson[key] === "object") {
        newAttributes.push({
          id: makeRandomId(),
          name: key,
          type: "JSON",
          value: JSON.stringify(attributesJson[key], null, 2),
          required: false,
        })
      }
    })

    // add missing custom attributes
    attributesTestCase.forEach((testAttribute) => {
      const existingAttribute = newAttributes.find((attr) => attr.name === testAttribute.name)
      if (!existingAttribute) {
        newAttributes.push(testAttribute)
      } else if (testAttribute.type !== existingAttribute.type) {
        existingAttribute.type = testAttribute.type
      } else if (testAttribute.required && !existingAttribute.required) {
        existingAttribute.required = testAttribute.required as boolean
      }
    })

    setAttributes(newAttributes)
    setValue("attributes", newAttributes, { shouldDirty: true })
  }

  return {
    attributes,
    setAttributes,
    resetAttributes,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    loadAttributeJson,
    isLoading: isLoadingAttributesTestCase,
  }
}
