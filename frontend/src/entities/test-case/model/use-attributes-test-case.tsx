import { useGetCustomAttributesQuery } from "entities/custom-attribute/api"
import { convertAttribute } from "entities/custom-attribute/lib"
import { useAttributes } from "entities/custom-attribute/model"
import { useEffect, useMemo } from "react"
import { UseFormSetValue } from "react-hook-form"

import { useProjectContext } from "pages/project"

interface UseAttributesProps {
  mode: "create" | "edit"
  setValue: UseFormSetValue<TestCaseFormData>
  testSuiteId: string | null
}

export const useAttributesTestCase = ({ mode, setValue, testSuiteId }: UseAttributesProps) => {
  const project = useProjectContext()

  const { data, isLoading: isLoadingCustomAttributes } = useGetCustomAttributesQuery({
    project: project.id.toString(),
  })

  const initAttributes = useMemo(() => {
    if (!data) return []

    return data
      .filter((i) => i.applied_to.testcase)
      .filter((attribute) => {
        const isSuiteSpecific = !!attribute.applied_to.testcase.suite_ids.length
        if (!isSuiteSpecific) return true
        if (!testSuiteId) return false

        return attribute.applied_to.testcase.suite_ids.includes(Number(testSuiteId))
      })
      .map((i) => convertAttribute({ attribute: i, model: "testcase" }))
  }, [data, testSuiteId])

  const handleSetValue = (attributes: Attribute[]) => {
    setValue("attributes", attributes, { shouldDirty: true })
  }

  const {
    attributes,
    addAttribute,
    getAttributeJson,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    resetAttributes,
    setAttributes,
    generateAttributeCopy,
  } = useAttributes({
    mode,
    initAttributes,
    setValue: handleSetValue,
    getJsonAdditionalParams: {
      required: false,
    },
  })

  useEffect(() => {
    if (attributes.length === 0) {
      setAttributes(initAttributes)
      return
    }

    const newAttributes: Attribute[] = []
    const isEqual = (a: Attribute, b: Attribute) =>
      a.id === b.id || (a.name === b.name && a.type === b.type)
    const existing = attributes.filter((existAttr) =>
      initAttributes.find((newAttr) => isEqual(existAttr, newAttr))
    )
    const notExisting = attributes
      .filter((prevAttr) => !existing.find((existingAttr) => isEqual(prevAttr, existingAttr)))
      .map(generateAttributeCopy)

    initAttributes.forEach((newAttr) => {
      const existingAttribute = existing.find((ex) => isEqual(ex, newAttr))
      if (existingAttribute) {
        newAttributes.push({
          ...newAttr,
          value: existingAttribute.value,
        })
      } else {
        newAttributes.push(newAttr)
      }
    })
    notExisting.forEach((attribute) => {
      newAttributes.push(attribute)
    })
    setAttributes(newAttributes)
  }, [initAttributes])

  return {
    attributes,
    isLoading: isLoadingCustomAttributes,
    initAttributes,
    setAttributes,
    resetAttributes,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    getAttributeJson,
  }
}
