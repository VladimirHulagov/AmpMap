import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { useTestCaseFormLabels } from "entities/label/model"

import { useGetTestSuitesQuery } from "entities/suite/api"

import { useGetTestCaseByIdQuery, useUpdateTestCaseMutation } from "entities/test-case/api"
import { useAttributesTestCase } from "entities/test-case/model"

import { useProjectContext } from "pages/project"

import { useConfirmBeforeRedirect, useErrors } from "shared/hooks"
import { makeAttributesJson } from "shared/libs"
import { antdModalCloseConfirm, antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { AlertSuccessChange } from "shared/ui"

import { formattingAttachmentForSteps, sortingSteps } from "../utils"

interface SubmitData extends Omit<TestCaseFormData, "steps"> {
  steps?: StepAttachNumber[]
  is_steps: boolean
}

interface ErrorData {
  suite?: string
  name?: string
  setup?: string
  scenario?: string
  steps?: string
  expected?: string
  teardown?: string
  estimate?: string
  description?: string
  labels?: string
  attributes?: string | null
}

type TabType = "general" | "attachments"

export const useTestCaseEditView = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const testCaseId = searchParams.get("test_case")

  const [tab, setTab] = useState<TabType>("general")

  const { data: testCase, isLoading: isLoadingTestCase } = useGetTestCaseByIdQuery(
    { testCaseId: String(testCaseId) },
    {
      skip: !testCaseId,
    }
  )

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const editForm = useForm<TestCaseFormData>({
    defaultValues: {
      name: "",
      description: "",
      setup: "",
      scenario: "",
      expected: "",
      teardown: "",
      estimate: null,
      is_steps: false,
      labels: [],
      suite: undefined,
      attributes: [],
      attachments: [],
      steps: [],
    },
  })
  const {
    control,
    formState: { errors: formErrors, isDirty },
    watch,
    setValue,
    reset,
    setError: setFormError,
    register,
    clearErrors,
    handleSubmit,
  } = editForm

  const isSteps = watch("is_steps") ?? false
  const steps = watch("steps") ?? []

  const [selectedSuite, setSelectedSuite] = useState<SelectData | null>(null)
  const [updateTestCase, { isLoading }] = useUpdateTestCaseMutation()
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

  const {
    attributes,
    isLoading: isLoadingAttributesTestCase,
    setAttributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    getAttributeJson,
  } = useAttributesTestCase({
    mode: "edit",
    setValue,
    testSuiteId: String(selectedSuite?.value ?? testCase?.suite?.id ?? "") || null,
  })

  const labelProps = useTestCaseFormLabels({
    setValue,
    testCase: testCase ?? null,
    isEditMode: true,
    defaultLabels: testCase?.labels.map((l) => Number(l.id)) ?? [],
  })

  const { data: suites, isLoading: isLoadingSuites } = useGetTestSuitesQuery({
    project: project.id,
  })

  useEffect(() => {
    if (testCase?.suite) {
      setSelectedSuite({ label: testCase.suite.name, value: testCase.suite.id })
      return
    }
  }, [testCase])

  const { setIsRedirectByUser } = useConfirmBeforeRedirect({
    isDirty,
    pathname: "edit-test-case",
  })

  const handleCloseModal = () => {
    setIsRedirectByUser()
    redirectToPrev()
    setErrors(null)
    setTab("general")
    reset()
    onReset()
    setAttributes([])
    labelProps.setLabels([])
    labelProps.setSearchValue("")
  }

  const handleTabChange = (activeKey: string) => {
    setTab(activeKey as TabType)
  }

  const confirmSwitchSuite = () => {
    return new Promise((resolve) => {
      antdModalConfirm("change-suite", {
        title: t("Do you want to change suite?"),
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
        content: t("Please confirm to change suite."),
      })
    })
  }

  const onSubmit = async (data: TestCaseFormData, asCurrent = true) => {
    if (!testCase) return
    const dataForm = data as SubmitData

    if (data.is_steps && !data.steps?.length) {
      setFormError("steps", { type: "required", message: t("Required field") })
      return
    }

    if (!data.is_steps && !data.scenario?.length) {
      setFormError("scenario", { type: "required", message: t("Required field") })
      return
    }

    const { isSuccess, attributesJson, errors: attributesErrors } = makeAttributesJson(attributes)
    if (!isSuccess) {
      setErrors({ attributes: JSON.stringify(attributesErrors) })
      return
    }

    const isSwitchingSuite = dataForm.suite && dataForm.suite !== Number(testCase?.suite.id)
    if (isSwitchingSuite) {
      const isConfirmed = await confirmSwitchSuite()
      if (!isConfirmed) return
    }
    setErrors(null)

    try {
      const stepsFormat = dataForm.steps
        ? dataForm.steps.map((step) => formattingAttachmentForSteps(step))
        : []
      const sortSteps = sortingSteps(stepsFormat)

      const newTestCase = await updateTestCase({
        ...testCase,
        ...dataForm,
        attachments: dataForm.attachments,
        is_steps: !!dataForm.is_steps,
        scenario: dataForm.is_steps ? undefined : dataForm.scenario,
        steps: dataForm.is_steps ? sortSteps : [],
        estimate: dataForm.estimate?.length ? dataForm.estimate : null,
        skip_history: asCurrent,
        attributes: attributesJson,
      }).unwrap()
      setSearchParams({
        version: String(newTestCase.versions[0]),
        test_case: String(testCase.id),
      })
      handleCloseModal()
      antdNotification.success("edit-test-case", {
        description: (
          <AlertSuccessChange
            id={String(newTestCase.id)}
            action="updated"
            title={t("Test Case")}
            link={`/projects/${project.id}/suites/${testCase.suite.id}?test_case=${newTestCase.id}`}
            data-testid="edit-test-case-success-notification-description"
          />
        ),
      })
      if (dataForm.suite !== Number(testCase?.suite.id)) {
        navigate(`/projects/${project.id}/suites/${dataForm.suite}?test_case=${newTestCase.id}`)
      }
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  const onSubmitWithoutNewVersion: SubmitHandler<TestCaseFormData> = (data) => {
    onSubmit(data, true)
  }

  const onSubmitAsNewVersion: SubmitHandler<TestCaseFormData> = (data) => {
    onSubmit(data, false)
  }

  const handleCancel = () => {
    if (isLoading) return

    if (isDirty) {
      antdModalCloseConfirm(handleCloseModal)
      return
    }

    handleCloseModal()
  }

  const redirectToPrev = () => {
    const prevUrl = searchParams.get("prevUrl")
    navigate(
      prevUrl ?? `/projects/${project.id}/suites/${selectedSuite?.value}?test_case=${testCaseId}`
    )
  }

  const handleSelectSuite = (selectedData: SelectData) => {
    setValue("suite", selectedData.value, { shouldDirty: true })
    setSelectedSuite(selectedData)
  }

  useEffect(() => {
    if (!testCase || isLoadingAttributesTestCase) return

    const testCaseAttachesWithUid = testCase.attachments.map((attach) => ({
      ...attach,
      uid: String(attach.id),
    }))
    const stepsSorted = [...testCase.steps].sort((a, b) => a.sort_order - b.sort_order)
    if (testCaseAttachesWithUid.length) {
      setAttachments(testCaseAttachesWithUid)
    }

    const attrs = getAttributeJson(testCase.attributes)
    setAttributes(attrs)

    reset(
      {
        name: testCase.name,
        description: testCase.description,
        setup: testCase.setup,
        scenario: testCase.scenario ?? "",
        expected: testCase.expected ?? "",
        teardown: testCase.teardown,
        estimate: testCase.estimate,
        steps: stepsSorted,
        is_steps: testCase.is_steps,
        labels: testCase.labels,
        suite: Number(testCase.suite.id),
        attributes: attrs,
        attachments: testCaseAttachesWithUid.map((attach) => attach.id),
      },
      {
        keepDirty: false,
      }
    )
  }, [testCase, isLoadingAttributesTestCase])

  const shouldShowSuiteSelect = !isLoadingSuites
  const title = `${t("Edit Test Case")} '${testCase?.name}'`

  return {
    editForm,
    title,
    isLoading:
      isLoading || isLoadingTestCase || isLoadingAttachments || isLoadingAttributesTestCase,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    isSteps,
    isDirty,
    tab,
    selectedSuite,
    shouldShowSuiteSelect,
    suites,
    steps: steps ?? [],
    onLoad,
    onRemove,
    onChange,
    setValue,
    clearErrors,
    setAttachments,
    handleCancel,
    handleSubmitFormAsNew: handleSubmit(onSubmitAsNewVersion),
    handleSubmitFormAsCurrent: handleSubmit(onSubmitWithoutNewVersion),
    register,
    labelProps,
    handleTabChange,
    attributes,
    setAttributes,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    handleSelectSuite,
  }
}
