import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router"

import { useAppDispatch } from "app/hooks"

import { useCreateSuiteMutation } from "entities/suite/api"
import { setTestSuite } from "entities/suite/model/slice"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

interface ErrorData {
  name?: string
  parent?: string
  description?: string
}

export const useSuiteCreateModal = (onSubmitCb: () => void, suite?: Suite) => {
  const [isShow, setIsShow] = useState(false)

  const dispatch = useAppDispatch()
  const { projectId } = useParams<ParamProjectId>()
  const [selectedParent, setSelectedParent] = useState<SelectData | null>(null)
  const [createSuite, { isLoading: isLoadingCreating, isSuccess: isSuccessCreate }] =
    useCreateSuiteMutation()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty, errors: formErrors },
  } = useForm<SuiteUpdate>({
    defaultValues: {
      name: "",
      description: "",
      parent: null,
    },
  })

  useEffect(() => {
    if (!isShow || !suite) return
    setSelectedParent({ value: Number(suite.id), label: suite.name })
    setValue("parent", String(suite.id))
  }, [isShow, suite])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    reset()
    setSelectedParent(null)
  }

  const handleCancel = () => {
    if (isLoadingCreating) {
      return
    }

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  const handleShowCreate = () => {
    setIsShow(true)
  }

  const onSubmit: SubmitHandler<SuiteUpdate> = async (data) => {
    setErrors(null)

    try {
      const newSuite = await createSuite({ ...data, project: Number(projectId) }).unwrap()

      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action="created"
            title="Test Suite"
            link={`/projects/${projectId}/suites/${newSuite.id}`}
            id={String(newSuite.id)}
          />
        ),
      })

      dispatch(setTestSuite(newSuite))
      onCloseModal()
      onSubmitCb()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleSelectParent = (value?: SelectData | null) => {
    setErrors({ parent: "" })
    if (Number(value?.value) === Number(suite?.id)) {
      setErrors({ parent: "Test Suite не может быть родителем для самого себя." })
      return
    }

    if (value) {
      setValue("parent", String(value.value), { shouldDirty: true })
      setSelectedParent({ value: value.value, label: value.label })
    }
  }

  const handleClearParent = () => {
    setSelectedParent(null)
    setValue("parent", null, { shouldDirty: true })
  }

  return {
    isShow,
    isLoadingCreating,
    isSuccessCreate,
    isDirty,
    selectedParent,
    control,
    errors,
    formErrors,
    handleShowCreate,
    handleClearParent,
    handleSelectParent,
    handleCancel,
    onSubmit,
    handleSubmitForm: handleSubmit(onSubmit),
    setValue,
  }
}
