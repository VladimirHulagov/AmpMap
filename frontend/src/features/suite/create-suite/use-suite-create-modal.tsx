import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router"

import { useAppDispatch } from "app/hooks"

import { useCreateSuiteMutation, useLazyGetSuiteQuery } from "entities/suite/api"
import { setTestSuite } from "entities/suite/model/slice"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

type ErrorData = {
  name?: string
  parent?: string
  description?: string
}

export const useSuiteCreateModal = () => {
  const [isShow, setIsShow] = useState(false)

  const dispatch = useAppDispatch()
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [selectedParent, setSelectedParent] = useState<{ label: string; value: number } | null>(
    null
  )
  const [createSuite, { isLoading: isLoadingCreating, isSuccess: isSuccessCreate }] =
    useCreateSuiteMutation()
  const [getSuite] = useLazyGetSuiteQuery()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<ISuiteUpdate>({
    defaultValues: {
      name: "",
      description: "",
      parent: null,
    },
  })

  useEffect(() => {
    if (!isShow || !testSuiteId) return
    getSuite({ suiteId: testSuiteId })
      .unwrap()
      .then((res) => {
        setSelectedParent({ value: res.id, label: res.name })
        setValue("parent", String(res.id))
      })
  }, [isShow, testSuiteId])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    reset()
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

  const onSubmit: SubmitHandler<ISuiteUpdate> = async (data) => {
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
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleSelectParent = (value?: { label: string; value: number }) => {
    setErrors({ parent: "" })
    if (Number(value?.value) === Number(testSuiteId)) {
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
    handleShowCreate,
    handleClearParent,
    handleSelectParent,
    handleCancel,
    onSubmit,
    handleSubmitForm: handleSubmit(onSubmit),
    isShow,
    isLoadingCreating,
    isSuccessCreate,
    isDirty,
    selectedParent,
    control,
    errors,
    setValue,
  }
}
