import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router"

import { useAppDispatch, useAppSelector } from "app/hooks"

import {
  useCreateSuiteMutation,
  useLazyGetTestSuitesTreeViewQuery,
  useUpdateTestSuiteMutation,
} from "entities/suite/api"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { selectTestSuite, setTestSuite } from "./slice"

type ErrorData = {
  name?: string
  parent?: string
  description?: string
}

export const useSuiteModal = () => {
  const [isShow, setIsShow] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const dispatch = useAppDispatch()
  const testSuite = useAppSelector(selectTestSuite)
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [selectedParent, setSelectedParent] = useState<number | null>(null)
  const [getTestSuites, { data: treeSuites, isLoading: isLoadingTreeSuites }] =
    useLazyGetTestSuitesTreeViewQuery()
  const [createSuite, { isLoading: isLoadingCreating, isSuccess: isSuccessCreate }] =
    useCreateSuiteMutation()
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
    if (!isShow || !isEditMode || !testSuite || !testSuite.parent) return

    setSelectedParent(Number(testSuite.parent))
    setValue("parent", testSuite.parent)
  }, [isShow, isEditMode, testSuite])

  // use effect for create modal
  useEffect(() => {
    if (!isShow || isEditMode || !testSuiteId || !testSuite || !treeSuites) return

    setSelectedParent(Number(testSuiteId))
    setValue("parent", testSuiteId)
  }, [isShow, testSuiteId, testSuite, isEditMode, treeSuites])

  useEffect(() => {
    if (!isShow || !isEditMode || !testSuite) return

    setValue("name", testSuite.name)
    setValue("parent", testSuite.parent)
    setValue("description", testSuite.description)
  }, [isShow, isEditMode, testSuite])

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
    if (isLoadingCreating || isLoadingUpdating) {
      return
    }

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  const handleShowEdit = () => {
    setIsEditMode(true)
    setIsShow(true)
  }

  const handleShowCreate = () => {
    setIsEditMode(false)
    setIsShow(true)
  }

  const onSubmit: SubmitHandler<ISuiteUpdate> = async (data) => {
    setErrors(null)
    let newSuite = null

    if (Number(data.parent) === Number(testSuite?.id) && isEditMode) {
      setErrors({ parent: "Элемент не может быть потомком самому себе." })
      return
    }

    try {
      if (isEditMode && testSuite && projectId) {
        newSuite = await updateSuite({
          id: testSuite.id,
          body: { ...data, parent: data.parent || "" },
        }).unwrap()
      } else {
        newSuite = await createSuite({ ...data, project: Number(projectId) }).unwrap()
      }
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action={isEditMode ? "updated" : "created"}
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
    props: {
      handleShowEdit,
      handleShowCreate,
      handleClearParent,
      handleSelectParent,
      handleCancel,
      onSubmit,
      handleSubmitForm: handleSubmit(onSubmit),
      handleFetchTreeSuites,
      isShow,
      isEditMode,
      isLoadingCreating,
      isLoadingUpdating,
      isLoadingTreeSuites,
      isSuccessCreate,
      isSuccessUpdate,
      isDirty,
      selectedParent,
      testSuite,
      treeSuites,
      control,
      errors,
      setValue,
    },
  }
}
