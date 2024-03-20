import { notification } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import { useGetProjectsQuery } from "entities/project/api"

import { useCopySuiteMutation } from "entities/suite/api"

import { initInternalError, isFetchBaseQueryError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

interface FormSuiteCopy {
  new_name: string
  project: SelectData | null
  suite: SelectData | null
}

interface ErrorData {
  suites: {
    id: string[]
    new_name?: string[]
  }[]
}

export const useSuiteCopyModal = (mainSuite: Suite) => {
  const [errors, setErrors] = useState<string[]>([])
  const [isShow, setIsShow] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<SelectData | null>(null)

  const [copySuite, { isLoading }] = useCopySuiteMutation()
  // TODO page_size 1000 = hack, need be scroll loading as search-field.tsx
  const { data: dataProjects, isLoading: isLoadingProjects } = useGetProjectsQuery(
    {
      page: 1,
      page_size: 1000,
    },
    { skip: !isShow }
  )

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty, errors: formErrors },
    setValue,
    watch,
  } = useForm<FormSuiteCopy>({
    defaultValues: {
      new_name: `${mainSuite.name}(Copy)`,
      project: null,
      suite: null,
    },
  })
  const watchProject = watch("project")

  const onHandleError = (err: unknown) => {
    if (isFetchBaseQueryError(err) && err?.status === 400) {
      const error = err.data as ErrorData
      const newNameErorrs = error.suites[0].new_name!
      setErrors(newNameErorrs)
    } else {
      initInternalError(err)
    }
  }

  const handleCancel = () => {
    setIsShow(false)
    setErrors([])
    reset()
  }

  const handleShow = () => {
    setIsShow(true)
  }

  const handleSave = async ({ new_name, project, suite }: FormSuiteCopy) => {
    if (!project) {
      setErrors(["Project is required"])
      return
    }

    if (!new_name.trim().length) {
      setErrors(["New name is not be empty"])
      return
    }

    try {
      const newSuite = await copySuite({
        suites: [{ id: mainSuite.id.toString(), new_name }],
        dst_project_id: project.value.toString(),
        dst_suite_id: suite ? suite.value.toString() : undefined,
      }).unwrap()
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            id={newSuite[0].id.toString()}
            link={`/projects/${newSuite[0].project}/suites/${newSuite[0].id}/`}
            action="copied"
            title="Suite"
          />
        ),
      })
      handleCancel()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleClearSuite = () => {
    setSelectedSuite(null)
    setValue("suite", null, { shouldDirty: true })
  }

  const handleSelectSuite = (value?: SelectData | null) => {
    if (value) {
      setValue("suite", value, { shouldDirty: true })
      setSelectedSuite({ value: value.value, label: value.label })
    }
  }

  const projects = useMemo(() => {
    if (!dataProjects) return []

    return dataProjects.results.map((i) => ({
      label: i.name,
      value: i.id,
    }))
  }, [dataProjects])

  useEffect(() => {
    reset({
      new_name: `${mainSuite.name}(Copy)`,
    })
  }, [mainSuite])

  return {
    errors,
    formErrors,
    isShow,
    isLoading,
    isDisabled: !isDirty || isLoading || isLoadingProjects,
    projects,
    control,
    selectedSuite,
    selectedProject: watchProject,
    handleCancel,
    handleShow,
    handleClearSuite,
    handleSelectSuite,
    handleSubmitForm: handleSubmit(handleSave),
  }
}
