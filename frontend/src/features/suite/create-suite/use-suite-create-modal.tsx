import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router"

import { useAppDispatch } from "app/hooks"

import { useCreateSuiteMutation } from "entities/suite/api"
import { useTestSuiteSearch } from "entities/suite/model"
import { setTestSuite } from "entities/suite/model/slice"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { useSearchField } from "widgets/search-field"

interface ErrorData {
  name?: string
  parent?: string
  description?: string
}

export const useSuiteCreateModal = (suite?: Suite) => {
  const [isShow, setIsShow] = useState(false)

  const dispatch = useAppDispatch()
  const { projectId } = useParams<ParamProjectId>()
  const [selectedParent, setSelectedParent] = useState<SelectData | null>(null)
  const [createSuite, { isLoading: isLoadingCreating, isSuccess: isSuccessCreate }] =
    useCreateSuiteMutation()

  const {
    search,
    paginationParams,
    handleSearch: handleSearchField,
    handleLoadNextPageData,
  } = useSearchField()

  const {
    isLoading: isLoadingTestSuites,
    data: dataTestSuites,
    isLastPage,
    searchSuite,
  } = useTestSuiteSearch()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<SuiteUpdate>({
    defaultValues: {
      name: "",
      description: "",
      parent: null,
    },
  })

  useEffect(() => {
    if (!projectId || search === undefined) return
    searchSuite({
      search,
      project: projectId,
      page: paginationParams.page,
      page_size: paginationParams.page_size,
    })
  }, [paginationParams, search, projectId])

  useEffect(() => {
    if (!isShow || !suite) return
    setSelectedParent({ value: Number(suite.id), label: suite.name })
    setValue("parent", String(suite.id))
  }, [isShow, suite])

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
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleSelectParent = (value?: { label: string; value: number }) => {
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
    dataTestSuites,
    isLoadingTestSuites,
    isLastPage,
    handleShowCreate,
    handleClearParent,
    handleSelectParent,
    handleCancel,
    onSubmit,
    handleSubmitForm: handleSubmit(onSubmit),
    setValue,
    handleSearch: handleSearchField,
    handleLoadNextPageData,
  }
}
