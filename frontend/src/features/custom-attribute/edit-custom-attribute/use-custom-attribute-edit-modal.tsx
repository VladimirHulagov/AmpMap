import { notification } from "antd"
import {
  useGetCustomAttributeContentTypesQuery,
  useUpdateCustomAttributeMutation,
} from "entities/custom-attribute/api"
import {
  hideModal,
  selectAttribute,
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

interface Props {
  attribute: CustomAttribute
}

export const useCustomAttributeEditModal = ({ attribute }: Props) => {
  const { projectId } = useParams<ParamProjectId>()
  const dispatch = useAppDispatch()

  const isShowModal = useAppSelector(selectModalIsShow)
  const isEditMode = useAppSelector(selectModalIsEditMode)
  const selectedAttribute = useAppSelector(selectAttribute)

  const isShow = isShowModal && isEditMode && attribute.id === selectedAttribute?.id

  const title = `Edit Custom Attribute ${attribute?.name}`

  const [updateAttribute, { isLoading }] = useUpdateCustomAttributeMutation()

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
      if (attribute && projectId) {
        await updateAttribute({
          id: Number(attribute.id),
          body: data,
        }).unwrap()
        notification.success({
          message: "Success",
          description: "Attribute updated successfully",
        })
      }
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

  // use effect for edit modal
  useEffect(() => {
    if (!isShow || !attribute || !isEditMode) return

    setValue("name", attribute.name)
    setValue("type", attribute.type)
    setValue("is_required", attribute.is_required)
    setValue("content_types", attribute.content_types.map(Number))
    setValue("is_suite_specific", attribute.is_suite_specific)
    setValue("suite_ids", attribute.suite_ids)
  }, [isShow, attribute, isEditMode])

  // reset suite_ids when is_suite_specific becomes false
  useEffect(() => {
    if (!isSuiteSpecific) {
      setValue("suite_ids", undefined)
    }
  }, [isSuiteSpecific, setValue])

  return {
    title,
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
