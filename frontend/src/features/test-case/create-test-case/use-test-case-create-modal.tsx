import { notification } from "antd"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { useAttachments } from "entities/attachment/model"

import { useTestCaseFormLabels } from "entities/label/model"

import { useCreateTestCaseMutation } from "entities/test-case/api"
import { hideModal, selectModalIsEditMode, selectModalIsShow } from "entities/test-case/model"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
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
}

export const useTestCaseCreateModal = () => {
  const { projectId, testSuiteId } = useParams<ParamProjectId & ParamTestSuiteId>()
  const [isSteps, setIsSteps] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])

  const dispatch = useDispatch()
  const isShow = useAppSelector(selectModalIsShow)
  const isEditMode = useAppSelector(selectModalIsEditMode)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    register,
    setError: setFormError,
    clearErrors,
    formState: { isDirty, errors: formErrors },
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
  const labelProps = useTestCaseFormLabels({ setValue, testCase: null, isShow, isEditMode: false })

  const handleCloseModal = () => {
    dispatch(hideModal())
    setErrors(null)
    setSteps([])
    reset()
    onReset()
    labelProps.setLabels([])
    labelProps.setSearchValue("")
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

    if (data.is_steps && !data.steps?.length) {
      setFormError("steps", { type: "required", message: "Обязательное поле." })
      return
    }

    if (!data.is_steps && !data.scenario?.length) {
      setFormError("scenario", { type: "required", message: "Обязательное поле." })
      return
    }

    setErrors(null)

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
      }).unwrap()
      handleCloseModal()
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
      showModalCloseConfirm(handleCloseModal)
      return
    }

    handleCloseModal()
  }

  return {
    isEditMode,
    isShow,
    isLoading: isLoading || isLoadingAttachments,
    errors,
    formErrors,
    control,
    attachments,
    attachmentsIds,
    steps,
    isSteps,
    isDirty,
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
  }
}
