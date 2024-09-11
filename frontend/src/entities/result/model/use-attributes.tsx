import { useAttributesTestResult } from "entities/custom-attribute/model"
import { useStatuses } from "entities/status/model/use-statuses"
import { useEffect, useState } from "react"
import { UseFormSetValue } from "react-hook-form"
import { useParams } from "react-router-dom"

import { makeRandomId } from "shared/libs"

interface UseAttributesProps {
  mode: "create" | "edit"
  setValue: UseFormSetValue<ResultFormData>
}

export const useAttributes = ({ mode, setValue }: UseAttributesProps) => {
  const [attributes, setAttributes] = useState<Attribute[]>([])

  const { projectId } = useParams<ParamProjectId>()
  const { allStatusesId } = useStatuses({ project: projectId })

  const attributesTestResult = useAttributesTestResult()

  useEffect(() => {
    if (mode === "create" && attributesTestResult) {
      setAttributes(attributesTestResult)
    }
  }, [mode, attributesTestResult])

  const addAttribute = () => {
    const newAttributes = [
      ...attributes,
      {
        id: makeRandomId(),
        name: "",
        value: "",
        type: "Text",
        required: false,
        status_specific: allStatusesId,
      },
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
    setAttributes(mode === "create" ? attributesTestResult : [])
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
          status_specific: allStatusesId,
        })
      } else if (Array.isArray(attributesJson[key])) {
        const array: string[] = attributesJson[key] as string[]
        newAttributes.push({
          id: makeRandomId(),
          name: key,
          type: "List",
          value: array.join("\r\n"),
          required: false,
          status_specific: allStatusesId,
        })
      } else if (typeof attributesJson[key] === "object") {
        newAttributes.push({
          id: makeRandomId(),
          name: key,
          type: "JSON",
          value: JSON.stringify(attributesJson[key], null, 2),
          required: false,
          status_specific: allStatusesId,
        })
      }
    })

    // add missing custom attributes
    attributesTestResult.forEach((resultAttribute) => {
      const existingAttribute = newAttributes.find((attr) => attr.name === resultAttribute.name)
      if (!existingAttribute) {
        newAttributes.push(resultAttribute)
      } else if (resultAttribute.type !== existingAttribute.type) {
        existingAttribute.type = resultAttribute.type
      } else if (resultAttribute.required && !existingAttribute.required) {
        existingAttribute.required = resultAttribute.required as boolean
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
  }
}
