import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import { useUpdateTestSuiteMutation } from "entities/suite/api"

import { useErrors, useShowModalCloseConfirm } from "shared/hooks"
import { AlertSuccessChange } from "shared/ui"

interface ErrorData {
  name?: string
  parent?: string
  description?: string
}

interface Props {
  suite?: Suite
  onSubmit?: (suite: SuiteResponseUpdate, oldSuite: Suite) => void
}

export const useSuiteEditModal = ({ suite, onSubmit: onSubmitCb }: Props) => {
  const { t } = useTranslation()
  const { showModal } = useShowModalCloseConfirm()
  const [isShow, setIsShow] = useState(false)
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [selectedParent, setSelectedParent] = useState<SelectData | null>(null)
  const [updateSuite, { isLoading: isLoadingUpdating, isSuccess: isSuccessUpdate }] =
    useUpdateTestSuiteMutation()

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

    reset({
      name: suite.name,
      description: suite.description,
      parent: suite.parent ? suite.parent.id : null,
    })

    if (suite.parent) {
      setSelectedParent({ value: suite.parent.id, label: suite.parent.name })
    }
  }, [isShow, suite])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    reset()
    setSelectedParent(null)
  }

  const handleCancel = () => {
    if (isLoadingUpdating) {
      return
    }

    if (isDirty) {
      showModal(onCloseModal)
      return
    }

    onCloseModal()
  }

  const handleShowEdit = () => {
    setIsShow(true)
  }

  const onSubmit: SubmitHandler<SuiteUpdate> = async (data) => {
    setErrors(null)
    if (!suite) return
    if (Number(data.parent) === Number(suite.id)) {
      setErrors({ parent: t("An element cannot be a child of itself.") })
      return
    }

    try {
      const newSuite = await updateSuite({
        id: suite.id,
        body: { ...data, parent: data.parent ? Number(data.parent) : null },
      }).unwrap()

      notification.success({
        message: t("Success"),
        closable: true,
        description: (
          <AlertSuccessChange
            action="updated"
            title={t("Test Suite")}
            link={`/projects/${projectId}/suites/${newSuite.id}`}
            id={String(newSuite.id)}
          />
        ),
      })
      onSubmitCb?.(newSuite, suite)
      onCloseModal()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleSelectParent = (value?: SelectData | null) => {
    setErrors({ parent: "" })
    if (Number(value?.value) === Number(testSuiteId)) {
      setErrors({ parent: t("Test Suite cannot be its own parent.") })
      return
    }

    setValue("parent", value ? Number(value.value) : null, { shouldDirty: true })
    setSelectedParent(value ? { value: value.value, label: value.label } : null)
  }

  const handleClearParent = () => {
    setSelectedParent(null)
    setValue("parent", null, { shouldDirty: true })
  }

  return {
    isShow,
    isLoadingUpdating,
    isSuccessUpdate,
    isDirty,
    selectedParent,
    control,
    errors,
    formErrors,
    handleShowEdit,
    handleClearParent,
    handleSelectParent,
    handleCancel,
    onSubmit,
    handleSubmitForm: handleSubmit(onSubmit),
    setValue,
  }
}
