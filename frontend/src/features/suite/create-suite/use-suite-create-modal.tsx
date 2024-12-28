import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import { useCreateSuiteMutation, useGetSuiteQuery } from "entities/suite/api"

import { useErrors, useShowModalCloseConfirm } from "shared/hooks"
import { AlertSuccessChange } from "shared/ui"

interface ErrorData {
  name?: string
  parent?: string
  description?: string
}

export const useSuiteCreateModal = (onSubmitCb?: (suite: Suite) => void, initSuite?: Suite) => {
  const { t } = useTranslation()
  const { showModal } = useShowModalCloseConfirm()
  const [isShow, setIsShow] = useState(false)

  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [selectedParent, setSelectedParent] = useState<SelectData | null>(null)
  const [createSuite, { isLoading: isLoadingCreating, isSuccess: isSuccessCreate }] =
    useCreateSuiteMutation()

  const { data: suiteFromParams } = useGetSuiteQuery(Number(testSuiteId), { skip: !testSuiteId })
  const suite = testSuiteId ? (initSuite ?? suiteFromParams) : initSuite

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
    setValue("parent", suite.id)
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
      showModal(onCloseModal)
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
        message: t("Success"),
        closable: true,
        description: (
          <AlertSuccessChange
            action="created"
            title={t("Test Suite")}
            link={`/projects/${projectId}/suites/${newSuite.id}`}
            id={String(newSuite.id)}
          />
        ),
      })
      onCloseModal()
      onSubmitCb?.(newSuite)
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleSelectParent = (value?: SelectData | null) => {
    setErrors({ parent: "" })

    setValue("parent", value ? value.value : null, { shouldDirty: true })
    setSelectedParent(value ? { value: value.value, label: value.label } : null)
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
