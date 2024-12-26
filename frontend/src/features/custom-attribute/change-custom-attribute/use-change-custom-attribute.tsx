import { notification } from "antd"
import {
  useCreateCustomAttributeMutation,
  useGetCustomAttributeContentTypesQuery,
  useUpdateCustomAttributeMutation,
} from "entities/custom-attribute/api"
import { useStatuses } from "entities/status/model/use-statuses"
import { ChangeEvent, useContext, useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ProjectContext } from "pages/project"

import { useDebounce, useErrors, useModal } from "shared/hooks"
import { Status } from "shared/ui"

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
  const { t } = useTranslation()
  const { project } = useContext(ProjectContext)!
  const { statuses } = useStatuses({ project: project.id })
  const { handleClose: handleCloseModal, handleShow, isShow } = useModal()

  const [createAttribute, { isLoading: isLoadingCreate }] = useCreateCustomAttributeMutation()
  const [updateAttribute, { isLoading: isLoadingUpdate }] = useUpdateCustomAttributeMutation()
  const isLoading = isLoadingCreate || isLoadingUpdate

  const { data: contentTypes } = useGetCustomAttributeContentTypesQuery()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const [searchText, setSearchText] = useState("")
  const searchDebounce = useDebounce(searchText, 250, true)
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
      status_specific: attribute?.status_specific ?? statuses.map((i) => i.id),
      suite_ids: attribute?.suite_ids ?? [],
    },
  })

  const isSuiteSpecific = watch("is_suite_specific")
  const watchContentTypes = watch("content_types")
  const watchSuiteIds = watch("suite_ids")

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
        await createAttribute({ ...data, project: project.id }).unwrap()
      } else if (formType === "edit") {
        await updateAttribute({
          id: Number(attribute.id),
          body: data,
        }).unwrap()
      }

      notification.success({
        message: t("Success"),
        closable: true,
        description: `${formType === "create" ? t("Attribute created successfully") : t("Attribute edited successfully")}`,
      })
      handleClose()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleClose = () => {
    setErrors(null)
    reset()
    handleCloseModal()
  }

  const handleCheckSuite = (suiteId: number) => {
    if (watchSuiteIds?.includes(suiteId)) {
      setValue(
        "suite_ids",
        watchSuiteIds?.filter((i) => i !== suiteId),
        {
          shouldDirty: true,
        }
      )
    } else {
      setValue("suite_ids", [...(watchSuiteIds ?? []), suiteId], {
        shouldDirty: true,
      })
    }
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
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
    setValue("status_specific", attribute?.status_specific ?? statuses.map((i) => i.id))
    setValue("suite_ids", attribute.suite_ids)
  }, [attribute])

  useEffect(() => {
    if (attribute?.status_specific) {
      return
    }

    setValue(
      "status_specific",
      statuses.map((i) => i.id)
    )
  }, [statuses, attribute])

  const statusesOptions = useMemo(() => {
    return statuses.map((status) => ({
      label: <Status id={status.id} name={status.name} color={status.color} />,
      value: status.id,
    }))
  }, [statuses])

  return {
    isShow,
    control,
    errors,
    isLoading,
    isDirty,
    isSuiteSpecific,
    isTestResultActive,
    contentTypes,
    searchDebounce,
    searchText,
    statusesOptions,
    suiteSpecificIds: watchSuiteIds,
    handleClose,
    handleShow,
    handleSubmitForm: handleSubmit(onSubmit),
    handleCheckSuite,
    handleSearchChange,
  }
}
