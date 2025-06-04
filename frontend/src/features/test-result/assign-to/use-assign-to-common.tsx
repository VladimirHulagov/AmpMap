import { useMeContext } from "processes"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useErrors } from "shared/hooks"
import { antdNotification } from "shared/libs/antd-modals"

interface Props {
  onSubmit: (id: string) => Promise<void>
}

export interface UpdateData {
  assignUserId: string
}

export const useAssignToCommon = ({ onSubmit }: Props) => {
  const { t } = useTranslation()
  const { me } = useMeContext()

  const [selectedUser, setSelectedUser] = useState<SelectData | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty },
  } = useForm<UpdateData>()
  const [errors, setErrors] = useState<Partial<UpdateData> | null>(null)
  const { onHandleError } = useErrors<Partial<UpdateData>>(setErrors)

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  const handleOpenAssignModal = () => {
    setIsOpen(true)
  }

  const performRequest = async (id: string) => {
    setErrors(null)
    try {
      await onSubmit(id)
      handleClose()

      antdNotification.success("assign-to-common", {
        description: t("User assigned successfully"),
      })
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleAssignToMe = () => {
    if (!me) return

    performRequest(String(me.id))
  }

  const onSubmitHandler: SubmitHandler<UpdateData> = (data) => {
    performRequest(data.assignUserId)
  }

  const handleAssignUserChange = (data?: SelectData) => {
    if (!data) return
    setSelectedUser(data)
    setValue("assignUserId", String(data.value) || "", { shouldDirty: true })
  }

  const handleAssignUserClear = () => {
    setSelectedUser(null)
    setValue("assignUserId", "", { shouldDirty: true })
  }

  return {
    isOpen,
    errors,
    isDirty,
    me,
    selectedUser: selectedUser ?? undefined,
    handleClose,
    handleSubmitForm: handleSubmit(onSubmitHandler),
    handleOpenAssignModal,
    handleAssignUserChange,
    handleAssignUserClear,
    handleAssignToMe,
    setSelectedUser,
  }
}
