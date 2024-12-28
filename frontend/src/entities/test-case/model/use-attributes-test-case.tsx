import {
  useGetCustomAttributeContentTypesQuery,
  useGetCustomAttributesQuery,
} from "entities/custom-attribute/api"
import { convertAttribute } from "entities/custom-attribute/lib"
import { useAttributes } from "entities/custom-attribute/model"
import { useMemo } from "react"
import { UseFormSetValue } from "react-hook-form"
import { useParams } from "react-router-dom"

interface UseAttributesProps {
  mode: "create" | "edit"
  setValue: UseFormSetValue<TestCaseFormData>
}

export const useAttributesTestCase = ({ mode, setValue }: UseAttributesProps) => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()

  const { data: contentTypes, isLoading: isLoadingContentTypes } =
    useGetCustomAttributeContentTypesQuery()
  const { data, isLoading: isLoadingCustomAttributes } = useGetCustomAttributesQuery(
    { project: projectId ?? "" },
    { skip: !projectId }
  )

  const initAttributes = useMemo(() => {
    if (!data || !contentTypes) return []

    const contentTypeId = contentTypes?.find((type) => type.label === "Test Case")?.value ?? null

    if (!contentTypeId) return []

    return data
      .filter((attribute) => attribute.content_types?.includes(contentTypeId))
      .filter((attribute) =>
        attribute.is_suite_specific && testSuiteId
          ? attribute.suite_ids.includes(Number(testSuiteId))
          : true
      )
      .map(convertAttribute)
  }, [data, contentTypes])

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
  } = useAttributes({
    mode,
    initAttributes,
    setValue: handleSetValue,
    getJsonAdditionalParams: {
      required: false,
    },
  })

  return {
    attributes,
    isLoading: isLoadingContentTypes || isLoadingCustomAttributes,
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
