import {
  useGetCustomAttributeContentTypesQuery,
  useGetCustomAttributesQuery,
} from "entities/custom-attribute/api"
import { convertAttribute } from "entities/custom-attribute/lib"
import { useAttributes } from "entities/custom-attribute/model"
import { useStatuses } from "entities/status/model/use-statuses"
import { useContext, useMemo } from "react"
import { UseFormSetValue } from "react-hook-form"

import { useAppSelector } from "app/hooks"

import { selectDrawerTest } from "entities/test/model"

import { ProjectContext } from "pages/project"

interface UseAttributesProps {
  mode: "create" | "edit"
  setValue: UseFormSetValue<ResultFormData>
}

export const useAttributesTestResult = ({ mode, setValue }: UseAttributesProps) => {
  const { project } = useContext(ProjectContext)!
  const { allStatusesId } = useStatuses({ project: project.id })

  const selectedDrawerTest = useAppSelector(selectDrawerTest)

  const { data: contentTypes } = useGetCustomAttributeContentTypesQuery()
  const { data } = useGetCustomAttributesQuery(
    { project: String(project.id), test: selectedDrawerTest?.id },
    { skip: !selectedDrawerTest }
  )

  const initAttributes = useMemo(() => {
    if (!data || !contentTypes) return []

    const contentTypeId = contentTypes?.find((type) => type.label === "Test Result")?.value ?? null

    if (!contentTypeId) return []

    return data
      .filter((attribute) => attribute.content_types?.includes(contentTypeId))
      .filter((attribute) =>
        attribute.is_suite_specific && selectedDrawerTest?.suite
          ? attribute.suite_ids.includes(selectedDrawerTest?.suite)
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
    addAttributeAdditionalParams: {
      required: false,
      status_specific: allStatusesId,
    },
    getJsonAdditionalParams: {
      required: false,
      status_specific: allStatusesId,
    },
  })

  return {
    attributes,
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
