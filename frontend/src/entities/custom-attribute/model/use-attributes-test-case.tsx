import {
  useGetCustomAttributeContentTypesQuery,
  useGetCustomAttributesQuery,
} from "entities/custom-attribute/api"
import { convertAttribute } from "entities/custom-attribute/lib"
import { useMemo } from "react"
import { useParams } from "react-router-dom"

export const useAttributesTestCase = () => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()

  const { data: contentTypes, isLoading: isLoadingContentTypes } =
    useGetCustomAttributeContentTypesQuery()
  const { data, isLoading: isLoadingCustomAttributes } = useGetCustomAttributesQuery(
    { project: projectId ?? "" },
    { skip: !projectId }
  )

  const attributes = useMemo(() => {
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

  return {
    attributes,
    isLoading: isLoadingContentTypes || isLoadingCustomAttributes,
  }
}
