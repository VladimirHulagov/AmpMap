import { notification } from "antd"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { useTestCaseFormLabels } from "entities/label/model"

import { useCreateTestCaseMutation } from "entities/test-case/api"
import { useAttributes } from "entities/test-case/model"

import { useConfirmBeforeRedirect, useErrors, useIsDirtyWithArrayField } from "shared/hooks"
import { makeAttributesJson, showModalCloseConfirm } from "shared/libs"
import { getPrevPageSearch } from "shared/libs/session-storage"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

interface SubmitData extends Omit<TestCaseFormData, "steps"> {
  steps?: StepAttachNumber[]
  is_steps: boolean
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

export const useTestCaseCreateView = () => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [isSteps, setIsSteps] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [tab, setTab] = useState<TabType>("general")
  const [searchParams] = useSearchParams()

  const navigate = useNavigate()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    register,
    setError: setFormError,
    clearErrors,
    formState: { errors: formErrors, dirtyFields },
  } = useForm<TestCaseFormData>()

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
  } = useAttachments<TestCaseFormData>(control, projectId)
  const labelProps = useTestCaseFormLabels({
    setValue,
    testCase: null,
    isShow: true,
    isEditMode: false,
  })

  const isDirty = useIsDirtyWithArrayField<IAttachmentWithUid>(
    Object.keys(dirtyFields),
    "attachments",
    attachments
  )

  const {
    attributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    resetAttributes,
  } = useAttributes({ mode: "create", setValue })

  const { setIsRedirectByUser } = useConfirmBeforeRedirect({
    isDirty,
    pathname: "new-test-case",
  })

  const redirectToTestCase = (id?: number) => {
    const prevSearchKey = searchParams.get("prevSearch")
    let url = `/projects/${projectId}/suites/${testSuiteId}`
    if (id !== undefined) {
      url += `?test_case=${id}`
    }
    if (!prevSearchKey) {
      navigate(url)
      return
    }

    const prevSearchResult = getPrevPageSearch(prevSearchKey)
    if (id !== undefined) {
      url += `&${prevSearchResult}`
    } else {
      url += `?${prevSearchResult}`
    }
    navigate(url)
  }

  const handleClose = (id?: number) => {
    setIsRedirectByUser()
    redirectToTestCase(id)
    setErrors(null)
    setSteps([])
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

  const formattingAttachmentForSteps = ({
    id,
    name,
    scenario,
    expected,
    sort_order,
    attachments,
  }: StepAttachNumber) => ({
    id: typeof id === "string" ? undefined : id,
    name,
    scenario,
    expected,
    sort_order,
    attachments: attachments.map((x: number | IAttachment) => {
      if (typeof x === "object") return x.id
      return x
    }),
  })

  const onSubmit: SubmitHandler<TestCaseFormData> = async (data) => {
    const dataForm = data as SubmitData

    const { isSuccess, attributesJson, errors } = makeAttributesJson(attributes)

    if (data.is_steps && !data.steps?.length) {
      setFormError("steps", { type: "required", message: "Обязательное поле." })
      return
    }

    if (!data.is_steps && !data.scenario?.length) {
      setFormError("scenario", { type: "required", message: "Обязательное поле." })
      return
    }

    setErrors(null)

    if (!isSuccess) {
      setErrors({ attributes: JSON.stringify(errors) })
      return
    }

    try {
      const stepsFormat = dataForm.steps
        ? dataForm.steps.map((step) => formattingAttachmentForSteps(step))
        : []

      const newTestCase = await createTestCase({
        ...dataForm,
        project: Number(projectId),
        is_steps: !!dataForm.is_steps,
        scenario: dataForm.is_steps ? undefined : dataForm.scenario,
        steps: dataForm.is_steps ? stepsFormat : undefined,
        estimate: dataForm.estimate?.length ? dataForm.estimate : undefined,
        suite: Number(testSuiteId),
        attributes: attributesJson,
      }).unwrap()
      handleClose(newTestCase.id)
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            id={String(newTestCase.id)}
            action="created"
            title="Test Case"
            link={`/projects/${projectId}/suites/${testSuiteId}?test_case=${newTestCase.id}`}
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
      showModalCloseConfirm(handleClose)
      return
    }

    handleClose()
  }

  return {
    isLoading: isLoading || isLoadingAttachments,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    steps,
    isSteps,
    isDirty,
    tab,
    attributes,
    setIsSteps,
    setSteps,
    onLoad,
    onRemove,
    onChange,
    setValue,
    clearErrors,
    setAttachments,
    handleCancel,
    handleSubmitForm: handleSubmit(onSubmit),
    register,
    labelProps,
    handleTabChange,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
  }
}
