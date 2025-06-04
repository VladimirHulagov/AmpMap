import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { initInternalError } from "shared/libs"

interface FormFields {
  entity: SelectData | null
}

interface Props {
  isLoading: boolean
  onSubmit: (entity: number, onLoading?: (toggle: boolean) => void) => Promise<void>
}

export const useMoveEntityModal = ({ isLoading: initIsLoading, onSubmit }: Props) => {
  const [isLoading, setIsLoading] = useState(initIsLoading)
  const [isShow, setIsShow] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [selectedEntity, setSelectedEntity] = useState<SelectData | null>(null)

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty, errors: formErrors },
    setValue,
  } = useForm<FormFields>({
    defaultValues: {
      entity: null,
    },
  })

  const onHandleError = (err: unknown) => {
    initInternalError(err)
  }

  const handleCancel = () => {
    setIsShow(false)
    setErrors([])
    reset()
  }

  const handleShow = () => {
    setIsShow(true)
  }

  const handleSave = async ({ entity }: FormFields) => {
    if (!entity?.value) {
      return
    }

    try {
      await onSubmit(entity.value, setIsLoading)
      handleCancel()
    } catch (e) {
      onHandleError(e)
    }
  }

  const handleSelectEntity = (value?: SelectData | null) => {
    if (value) {
      setValue("entity", value, { shouldDirty: true })
      setSelectedEntity(value)
    }
  }

  useEffect(() => {
    reset({
      entity: null,
    })
    setSelectedEntity(null)
  }, [isShow])

  return {
    isLoading,
    isShow,
    selectedEntity,
    handleSelectEntity,
    handleSave,
    handleShow,
    handleCancel,
    isDirty,
    errors,
    formErrors,
    control,
    handleSubmitForm: handleSubmit(handleSave),
  }
}
