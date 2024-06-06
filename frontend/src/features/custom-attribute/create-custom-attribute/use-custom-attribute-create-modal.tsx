import { notification } from "antd"
import {
  useCreateCustomAttributeMutation,
  useGetCustomAttributeContentTypesQuery,
} from "entities/custom-attribute/api"
import {
  hideModal,
  selectModalIsEditMode,
  selectModalIsShow,
} from "entities/custom-attribute/model"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useTestSuitesSearch } from "entities/suite/model/use-test-suites-search"

import { useErrors } from "shared/hooks"

interface ErrorData {
  name?: string
  type?: string
  content_types?: string
  is_required?: string
  suite_ids?: string
}

export const useCustomAttributeCreateModal = () => {
  const { projectId } = useParams<ParamProjectId>()
  const dispatch = useAppDispatch()

  const isShowModal = useAppSelector(selectModalIsShow)
  const isEditMode = useAppSelector(selectModalIsEditMode)
  const isShow = isShowModal && !isEditMode

  const [createAttribute, { isLoading }] = useCreateCustomAttributeMutation()

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
      name: "",
      type: 0,
      content_types: [],
    },
  })

  const {
    isLoading: isLoadingSearch,
    searchText,
    data: suitesData,
    expandedRowKeys,
    onSearch,
    onClearSearch,
    onRowExpand,
  } = useTestSuitesSearch({ isShow })

  const isSuiteSpecific = watch("is_suite_specific")

  const onSubmit: SubmitHandler<CustomAttributeUpdate> = async (data) => {
    setErrors(null)

    try {
      await createAttribute({ ...data, project: Number(projectId) }).unwrap()

      notification.success({
        message: "Success",
        description: "Attribute created successfully",
      })
      handleCloseModal()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleCloseModal = () => {
    setErrors(null)
    onClearSearch()
    reset()
    dispatch(hideModal())
  }

  const handleCancel = () => {
    if (!isLoading) {
      handleCloseModal()
    }
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

  return {
    isShow,
    control,
    errors,
    isLoading,
    isDirty,
    isSuiteSpecific,
    isLoadingSearch,
    suitesData,
    searchText,
    contentTypes,
    expandedRowKeys,
    handleCancel,
    handleSubmitForm: handleSubmit(onSubmit),
    onSearch,
    onClearSearch,
    onRowExpand,
    onSuiteCheck,
  }
}
