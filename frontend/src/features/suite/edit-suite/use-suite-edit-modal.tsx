import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useLazyGetTestSuitesTreeViewQuery, useUpdateTestSuiteMutation } from "entities/suite/api"
import { selectTestSuite, setTestSuite } from "entities/suite/model"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

type ErrorData = {
  name?: string
  parent?: string
  description?: string
}

export const useSuiteEditModal = () => {
  const [isShow, setIsShow] = useState(false)

  const dispatch = useAppDispatch()
  const testSuite = useAppSelector(selectTestSuite)
  const { projectId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [selectedParent, setSelectedParent] = useState<number | null>(null)
  const [getTestSuites, { data: treeSuites, isLoading: isLoadingTreeSuites }] =
    useLazyGetTestSuitesTreeViewQuery()
  const [updateSuite, { isLoading: isLoadingUpdating, isSuccess: isSuccessUpdate }] =
    useUpdateTestSuiteMutation()

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
    if (!isShow || !projectId) return
    handleFetchTreeSuites(projectId)
  }, [isShow, projectId])

  // use effect for edit modal
  useEffect(() => {
    if (!isShow || !testSuite || !testSuite.parent) return

    setSelectedParent(Number(testSuite.parent))
    setValue("parent", testSuite.parent)
  }, [isShow, testSuite])

  useEffect(() => {
    if (!isShow || !testSuite) return

    setValue("name", testSuite.name)
    setValue("parent", testSuite.parent)
    setValue("description", testSuite.description)
  }, [isShow, testSuite])

  useEffect(() => {
    if (isShow) return
    setSelectedParent(null)
  }, [isShow])

  const handleFetchTreeSuites = (projectId: string) => {
    getTestSuites({ project: projectId })
  }

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    reset()
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

  const onSubmit: SubmitHandler<ISuiteUpdate> = async (data) => {
    setErrors(null)

    if (Number(data.parent) === Number(testSuite?.id)) {
      setErrors({ parent: "Элемент не может быть потомком самому себе." })
      return
    }

    if (!testSuite) return

    try {
      const newSuite = await updateSuite({
        id: testSuite.id,
        body: { ...data, parent: data.parent || "" },
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

  const handleSelectParent = (value: number | null) => {
    setErrors(null)
    setSelectedParent(value)
    setValue("parent", value ? String(value) : null)
  }

  const handleClearParent = () => {
    setSelectedParent(null)
    setValue("parent", null)
  }

  return {
    handleShowEdit,
    handleClearParent,
    handleSelectParent,
    handleCancel,
    onSubmit,
    handleSubmitForm: handleSubmit(onSubmit),
    handleFetchTreeSuites,
    isShow,
    isLoadingUpdating,
    isLoadingTreeSuites,
    isSuccessUpdate,
    isDirty,
    selectedParent,
    testSuite,
    treeSuites,
    control,
    errors,
    setValue,
  }
}
