import { notification } from "antd"
import {
  useCreateCustomAttributeMutation,
  useGetCustomAttributeContentTypesQuery,
  useUpdateCustomAttributeMutation,
} from "entities/custom-attribute/api"
import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useTestSuitesSearch } from "entities/suite/model/use-test-suites-search"

import { statusesWithoutUntested } from "shared/config"
import { useErrors, useModal } from "shared/hooks"
import { Status } from "shared/ui"

const statusesOption = statusesWithoutUntested.map((status) => ({
  value: Number(status.value),
  label: <Status value={status.label} />,
}))

interface ErrorData {
  name?: string
  type?: string
  content_types?: string
  is_required?: string
  suite_ids?: string
  test_result_statuses?: number[]
}

interface PropsCreate {
  formType: "create"
  attribute?: undefined
}

interface PropsEdit {
  formType: "edit"
  attribute: CustomAttribute
}

export type PropsChangeCustomAttribute = PropsCreate | PropsEdit

export const useChangeCustomAttribute = ({ formType, attribute }: PropsChangeCustomAttribute) => {
  const { projectId } = useParams<ParamProjectId>()
  const { handleClose: handleCloseModal, handleShow, isShow } = useModal()

  const [createAttribute, { isLoading: isLoadingCreate }] = useCreateCustomAttributeMutation()
  const [updateAttribute, { isLoading: isLoadingUpdate }] = useUpdateCustomAttributeMutation()
  const isLoading = isLoadingCreate || isLoadingUpdate

  const { data: contentTypes } = useGetCustomAttributeContentTypesQuery()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<CustomAttributeUpdate>({
    defaultValues: {
      name: attribute?.name ?? "",
      type: attribute?.type ?? 0,
      is_suite_specific: attribute?.is_suite_specific ?? false,
      is_required: attribute?.is_required ?? false,
      content_types: attribute?.content_types ?? [],
      status_specific: attribute?.status_specific ?? statusesOption.map((i) => i.value),
      suite_ids: attribute?.suite_ids ?? [],
    },
  })

  const {
    searchText,
    data: suitesData,
    expandedRowKeys,
    onSearch,
    onClearSearch,
    onRowExpand,
  } = useTestSuitesSearch({ isShow })

  const isSuiteSpecific = watch("is_suite_specific")
  const watchContentTypes = watch("content_types")

  const isTestResultActive = useMemo(() => {
    if (!contentTypes) {
      return false
    }

    const testResultId = contentTypes.find((i) => i.label === "Test Result")?.value
    if (!testResultId) {
      return false
    }

    return watchContentTypes.includes(testResultId)
  }, [watchContentTypes, contentTypes])

  const onSubmit: SubmitHandler<CustomAttributeUpdate> = async (data) => {
    setErrors(null)

    try {
      if (formType === "create") {
        await createAttribute({ ...data, project: Number(projectId) }).unwrap()
      } else if (formType === "edit") {
        await updateAttribute({
          id: Number(attribute.id),
          body: data,
        }).unwrap()
      }

      notification.success({
        message: "Success",
        description: `Attribute ${formType === "create" ? "created" : "edited"} successfully`,
      })
      handleClose()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleClose = () => {
    setErrors(null)
    onClearSearch()
    reset()
    handleCloseModal()
  }

  const onSuiteCheck = (checkedKeys: CheckboxChecked) => {
    if ("checked" in checkedKeys) {
      setValue("suite_ids", checkedKeys.checked, { shouldDirty: true })
    }
  }

  // reset suite_ids when is_suite_specific becomes false
  useEffect(() => {
    if (!isSuiteSpecific) {
      setValue("suite_ids", undefined)
    }
  }, [isSuiteSpecific, setValue])

  useEffect(() => {
    if (!attribute) return

    setValue("name", attribute.name)
    setValue("type", attribute.type)
    setValue("is_required", attribute.is_required)
    setValue("content_types", attribute.content_types.map(Number))
    setValue("is_suite_specific", attribute.is_suite_specific)
    setValue("status_specific", attribute?.status_specific ?? statusesOption.map((i) => i.value))
    setValue("suite_ids", attribute.suite_ids)
  }, [attribute])

  return {
    isShow,
    control,
    errors,
    isLoading,
    isDirty,
    isSuiteSpecific,
    isTestResultActive,
    suitesData,
    searchText,
    contentTypes,
    expandedRowKeys,
    statusesOption,
    handleClose,
    handleShow,
    handleSubmitForm: handleSubmit(onSubmit),
    onSearch,
    onRowExpand,
    onSuiteCheck,
  }
}
