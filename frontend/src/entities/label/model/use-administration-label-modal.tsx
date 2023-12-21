import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { Modal, notification } from "antd"
import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { hideModal, selectModal } from "entities/label/model"

import { useErrors } from "shared/hooks"

import { useCreateLabelMutation, useDeleteLabelMutation, useUpdateLabelMutation } from "../api"

interface ErrorData {
  name?: string
  type?: string
}

export const useAdministrationLabelModal = () => {
  const { projectId } = useParams<ParamProjectId>()
  const dispatch = useAppDispatch()
  const modalState = useAppSelector(selectModal)

  const [createLabel, { isLoading: isLoadingCreating }] = useCreateLabelMutation()
  const [updateLabel, { isLoading: isLoadingUpdating }] = useUpdateLabelMutation()
  const [deleteLabel] = useDeleteLabelMutation()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<LabelUpdate>({
    defaultValues: {
      name: "",
      type: 0,
    },
  })

  const onSubmit: SubmitHandler<LabelUpdate> = async (data) => {
    setErrors(null)

    try {
      if (modalState.mode === "edit" && modalState.label && projectId) {
        await updateLabel({
          id: Number(modalState.label.id),
          body: data,
        }).unwrap()
      } else {
        await createLabel({ ...data, project: Number(projectId) }).unwrap()
      }
      notification.success({
        message: "Success",
        description: `Label ${modalState.mode === "edit" ? "updated" : "created"} successfully`,
      })
      handleCloseModal()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleDeleteLabel = (labelId: Id) => {
    Modal.confirm({
      title: "Do you want to delete these label?",
      okText: "Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteLabel(labelId).unwrap()
          notification.success({
            message: "Success",
            description: "Label deleted successfully",
          })
        } catch (err: unknown) {
          const error = err as FetchBaseQueryError

          console.error(error)
          notification.error({
            message: "Error!",
            description: "Internal server error. Showing in console log.",
          })
        }
      },
    })
  }

  const handleCloseModal = () => {
    setErrors(null)
    reset()
    dispatch(hideModal())
  }

  const handleCancel = () => {
    if (!isLoadingCreating || !isLoadingUpdating) {
      handleCloseModal()
    }
  }

  const title = useMemo(() => {
    return modalState.mode === "edit" ? `Edit Label ${modalState.label?.name}` : "Create Label"
  }, [modalState])

  // use effect for edit modal
  useEffect(() => {
    if (!modalState.isShow || modalState.mode !== "edit" || !modalState.label) return

    setValue("name", modalState.label.name)
    setValue("type", modalState.label.type)
  }, [modalState])

  return {
    title,
    isShow: modalState.isShow,
    mode: modalState.mode,
    control,
    errors,
    isLoading: isLoadingCreating || isLoadingUpdating,
    isDirty,
    handleCancel,
    handleDeleteLabel,
    handleSubmitForm: handleSubmit(onSubmit),
  }
}
