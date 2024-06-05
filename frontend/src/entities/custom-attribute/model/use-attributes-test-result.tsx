import {
  useGetCustomAttributeContentTypesQuery,
  useGetCustomAttributesQuery,
} from "entities/custom-attribute/api"
import { convertAttribute } from "entities/custom-attribute/lib"
import { useMemo } from "react"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { selectTest } from "entities/test/model"

export const useAttributesTestResult = () => {
  const { projectId } = useParams<ParamProjectId>()

  const testSuiteId = useAppSelector(selectTest)?.suite

  const { data: contentTypes } = useGetCustomAttributeContentTypesQuery()
  const { data } = useGetCustomAttributesQuery({ project: projectId ?? "" }, { skip: !projectId })

  const attributes = useMemo(() => {
    if (!data || !contentTypes) return []

    const contentTypeId = contentTypes?.find((type) => type.label === "Test Result")?.value ?? null

    if (!contentTypeId) return []

    return data
      .filter((attribute) => attribute.content_types?.includes(contentTypeId))
      .filter((attribute) =>
        attribute.is_suite_specific && testSuiteId
          ? attribute.suite_ids.includes(testSuiteId)
          : true
      )
      .map(convertAttribute)
  }, [data, contentTypes])

  return attributes
}
