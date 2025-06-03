import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { useTestCaseFormLabels } from "entities/label/model"

import { useLazyGetSuiteQuery } from "entities/suite/api"

import { useCreateTestCaseMutation } from "entities/test-case/api"
import { useAttributesTestCase } from "entities/test-case/model"

import { useProjectContext } from "pages/project"

import { useConfirmBeforeRedirect, useErrors } from "shared/hooks"
import { makeAttributesJson } from "shared/libs"
import { antdModalCloseConfirm, antdNotification } from "shared/libs/antd-modals"
import { AlertSuccessChange } from "shared/ui"

import { formattingAttachmentForSteps, sortingSteps } from "../utils"

interface SubmitData extends Omit<TestCaseFormData, "steps"> {
  steps?: StepAttachNumber[]
  is_steps: boolean
}

interface LocationState {
  suite?: Suite
}

interface ErrorData {
  suite?: string
  name?: string
  setup?: string
  scenario?: string
  expected?: string
  teardown?: string
  estimate?: string
  description?: string
  labels?: string
  attributes?: string | null
}

type TabType = "general" | "attachments"

const getDefaultValues = (projectId: number) => ({
  name: "",
  scenario: "",
  project: projectId,
  suite: undefined,
  expected: "",
  setup: "",
  teardown: "",
  estimate: null,
  description: "",
  attachments: [],
  steps: [],
  is_steps: false,
  labels: [],
  attributes: [],
})

export const useTestCaseCreateView = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>("general")
  const [searchParams] = useSearchParams()

  const state = location.state as LocationState | null
  const [selectedSuite, setSelectedSuite] = useState<SelectData | null>(null)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const createForm = useForm<TestCaseFormData>({
    defaultValues: getDefaultValues(project.id),
  })
  const {
    control,
    formState: { errors: formErrors, isDirty },
    watch,
    setValue,
    reset,
    setError: setFormError,
    register,
    handleSubmit,
  } = createForm

  const isSteps = watch("is_steps") ?? false
  const steps = watch("steps") ?? []

  const [getTestSuite, { isLoading: isLoadingGetTestSuite }] = useLazyGetSuiteQuery()
  const [createTestCase, { isLoading }] = useCreateTestCaseMutation()
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    attachments,
    attachmentsIds,
    isLoading: isLoadingAttachments,
    setAttachments,
    onRemove,
    onLoad,
    onChange,
    onReset,
  } = useAttachments<TestCaseFormData>(control, project.id)
  const labelProps = useTestCaseFormLabels({
    setValue,
    testCase: null,
    isEditMode: false,
  })

  const {
    attributes,
    initAttributes,
    resetAttributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    isLoading: isLoadingAttributes,
  } = useAttributesTestCase({
    mode: "create",
    setValue,
    testSuiteId: selectedSuite ? String(selectedSuite.value) : null,
  })

  const { setIsRedirectByUser } = useConfirmBeforeRedirect({
    isDirty,
    pathname: "new-test-case",
  })

  const redirectToPrev = () => {
    const prevUrl = searchParams.get("prevUrl")

    if (prevUrl) {
      const url = new URL(prevUrl, window.location.origin)
      navigate(url.pathname + url.search)
    } else {
      navigate(`/projects/${project.id}/suites/${selectedSuite?.value}`)
    }
  }

  const redirectToCase = (id: number) => {
    navigate(`/projects/${project.id}/suites/${selectedSuite?.value}?test_case=${id}`)
  }

  const handleClose = (id?: number) => {
    setIsRedirectByUser()
    id ? redirectToCase(id) : redirectToPrev()
    setErrors(null)
    setTab("general")
    reset()
    onReset()
    resetAttributes()
    labelProps.setLabels([])
    labelProps.setSearchValue("")
  }

  const handleTabChange = (activeKey: string) => {
    setTab(activeKey as TabType)
  }

  const onSubmit: SubmitHandler<TestCaseFormData> = async (data) => {
    const dataForm = data as SubmitData

    const { isSuccess, attributesJson, errors: attributesErrors } = makeAttributesJson(attributes)
    if (!isSuccess) {
      setErrors({ attributes: JSON.stringify(attributesErrors) })
      return
    }

    if (data.is_steps && !data.steps?.length) {
      setFormError("steps", { type: "required", message: t("Required field") })
      return
    }

    if (!data.is_steps && !data.scenario?.length) {
      setFormError("scenario", { type: "required", message: t("Required field") })
      return
    }

    setErrors(null)

    try {
      const stepsFormat = dataForm.steps
        ? dataForm.steps.map((step) => formattingAttachmentForSteps(step))
        : []
      const sortSteps = sortingSteps(stepsFormat)

      const newTestCase = await createTestCase({
        ...dataForm,
        project: project.id,
        is_steps: !!dataForm.is_steps,
        scenario: dataForm.is_steps ? undefined : dataForm.scenario,
        steps: dataForm.is_steps ? sortSteps : undefined,
        estimate: dataForm.estimate?.length ? dataForm.estimate : undefined,
        suite: Number(selectedSuite?.value),
        attributes: attributesJson,
      }).unwrap()
      handleClose(newTestCase.id)
      antdNotification.success("create-test-case", {
        description: (
          <AlertSuccessChange
            id={String(newTestCase.id)}
            action="created"
            title={t("Test Case")}
            link={`/projects/${project.id}/suites/${selectedSuite?.value}?test_case=${newTestCase.id}`}
            data-testid="create-test-case-success-notification-description"
          />
        ),
      })
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  const handleCancel = () => {
    if (isLoading) return

    if (isDirty) {
      antdModalCloseConfirm(handleClose)
      return
    }

    handleClose()
  }

  const handleSelectSuite = (selectedData: SelectData) => {
    setValue("suite", selectedData.value, { shouldDirty: true })
    setSelectedSuite(selectedData)
  }

  useEffect(() => {
    setValue("attributes", initAttributes)
  }, [initAttributes])

  useEffect(() => {
    const suiteId = searchParams.get("suiteId")
    if (!suiteId || (suiteId && selectedSuite)) {
      return
    }

    const fetchSuite = async () => {
      const suite = await getTestSuite({ suiteId }).unwrap()
      setSelectedSuite({ label: suite.name, value: suite.id })
    }

    fetchSuite()
  }, [selectedSuite, searchParams.get("suiteId")])

  useEffect(() => {
    if (state?.suite) {
      setSelectedSuite({ label: state.suite.name, value: state.suite.id })
    }
  }, [state?.suite])

  return {
    createForm,
    isLoading: isLoading || isLoadingAttachments || isLoadingGetTestSuite || isLoadingAttributes,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    steps: steps ?? [],
    isSteps,
    isDirty,
    tab,
    attributes,
    selectedSuite,
    labelProps,
    onLoad,
    onRemove,
    onChange,
    setValue,
    setAttachments,
    handleCancel,
    handleSubmitForm: handleSubmit(onSubmit),
    register,
    handleTabChange,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    handleSelectSuite,
  }
}
