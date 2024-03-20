import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router"

import { useAppDispatch } from "app/hooks"

import { useUpdateTestSuiteMutation } from "entities/suite/api"
import { setTestSuite } from "entities/suite/model/slice"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

interface ErrorData {
  name?: string
  parent?: string
  description?: string
}

export const useSuiteEditModal = (suite?: Suite) => {
  const [isShow, setIsShow] = useState(false)

  const dispatch = useAppDispatch()
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

    setValue("name", suite.name)
    setValue("description", suite.description)

    if (suite.parent) {
      setSelectedParent({ value: Number(suite.parent.id), label: suite.parent.name })
      setValue("parent", String(suite.parent.id))
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
      showModalCloseConfirm(onCloseModal)
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
      setErrors({ parent: "Элемент не может быть потомком самому себе." })
      return
    }

    try {
      const newSuite = await updateSuite({
        id: suite.id,
        body: { ...data, parent: data.parent ?? "" },
      }).unwrap()

      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action="updated"
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

  const handleSelectParent = (value?: SelectData | null) => {
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
