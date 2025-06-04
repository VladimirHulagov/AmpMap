import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { CUSTOM_TYPE } from "shared/config/status-types"
import { useErrors } from "shared/hooks"
import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"

import { useCreateStatusMutation, useDeleteStatusMutation, useUpdateStatusMutation } from "../api"

interface ErrorData {
  name?: string
  type?: string
  color?: string
}

export const useAdministrationStatusModal = () => {
  const { t } = useTranslation()
  const { projectId } = useParams<ParamProjectId>()

  const [createStatus, { isLoading: isLoadingCreating }] = useCreateStatusMutation()
  const [updateStatus, { isLoading: isLoadingUpdating }] = useUpdateStatusMutation()
  const [deleteStatus] = useDeleteStatusMutation()
  const [isModalOpened, setIsModalOpened] = useState(false)
  const [modalStatus, setModalStatus] = useState<Status | undefined>(undefined)
  const [modalMode, setModalMode] = useState<ModalMode>("edit")

  const modalState = {
    isShow: isModalOpened,
    mode: modalMode,
    status: modalStatus,
  }

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<StatusUpdate>({
    defaultValues: {
      name: "",
      type: CUSTOM_TYPE,
      color: undefined,
    },
  })

  const handleModalOpen = ({ mode, status }: { mode: ModalMode; status?: Status }) => {
    setIsModalOpened(true)
    setModalMode(mode)
    setModalStatus(status)
  }

  const hideModal = () => {
    setIsModalOpened(false)
    setModalStatus(undefined)
  }

  const onSubmit: SubmitHandler<StatusUpdate> = async (data) => {
    setErrors(null)

    try {
      if (modalState.mode === "edit" && modalState.status && projectId) {
        await updateStatus({
          id: Number(modalState.status.id),
          body: data,
        }).unwrap()
      } else {
        await createStatus({ ...data, project: Number(projectId) }).unwrap()
      }
      antdNotification.success("create-status", {
        description:
          modalState.mode === "edit"
            ? t("Status updated successfully")
            : t("Status created successfully"),
      })
      handleCloseModal()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleDeleteStatus = (statusId: Id) => {
    antdModalConfirm("delete-status", {
      title: t("Do you want to delete these status?"),
      okText: t("Delete"),
      onOk: async () => {
        try {
          await deleteStatus(statusId).unwrap()
          antdNotification.success("delete-status", {
            description: t("Status deleted successfully"),
          })
        } catch (err: unknown) {
          initInternalError(err)
        }
      },
    })
  }

  const handleCloseModal = () => {
    setErrors(null)
    reset()
    hideModal()
  }

  const handleCancel = () => {
    if (!isLoadingCreating || !isLoadingUpdating) {
      handleCloseModal()
    }
  }

  const title = useMemo(() => {
    return modalState.mode === "edit"
      ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${t("Edit status")} ${modalState.status?.name}`
      : t("Create status")
  }, [modalState])

  // use effect for edit modal
  useEffect(() => {
    if (!modalState.isShow || modalState.mode !== "edit" || !modalState.status) return

    setValue("name", modalState.status.name)
    setValue("type", modalState.status.type)
    setValue("color", modalState.status.color)
  }, [modalState.isShow])

  return {
    title,
    isShow: modalState.isShow,
    mode: modalState.mode,
    control,
    errors,
    isLoading: isLoadingCreating || isLoadingUpdating,
    isDirty,
    handleCancel,
    handleDeleteStatus,
    handleSubmitForm: handleSubmit(onSubmit),
    handleModalOpen,
  }
}
