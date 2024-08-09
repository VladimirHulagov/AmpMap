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

  const selectedTest = useAppSelector(selectTest)

  const { data: contentTypes } = useGetCustomAttributeContentTypesQuery()
  const { data } = useGetCustomAttributesQuery(
    { project: projectId ?? "", test: selectedTest?.id },
    { skip: !projectId || !selectedTest }
  )

  const attributes = useMemo(() => {
    if (!data || !contentTypes) return []

    const contentTypeId = contentTypes?.find((type) => type.label === "Test Result")?.value ?? null

    if (!contentTypeId) return []

    return data
      .filter((attribute) => attribute.content_types?.includes(contentTypeId))
      .filter((attribute) =>
        attribute.is_suite_specific && selectedTest?.suite
          ? attribute.suite_ids.includes(selectedTest?.suite)
          : true
      )
      .map(convertAttribute)
  }, [data, contentTypes])

  return attributes
}
