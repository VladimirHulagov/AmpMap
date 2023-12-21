import { Modal, notification } from "antd"
import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { useAttachments } from "entities/attachment/model"

import { useTestCaseFormLabels } from "entities/label/model"

import { useGetTestSuitesTreeViewQuery } from "entities/suite/api"

import { useUpdateTestCaseMutation } from "entities/test-case/api"
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
  steps?: string
  expected?: string
  teardown?: string
  estimate?: string
  description?: string
  labels?: string
}

interface SortingStep {
  id: undefined
  name: string
  scenario: string
  expected: string
  sort_order: number
  attachments: number[]
}

interface Props {
  testCase: TestCase
}

export const useTestCaseEditModal = ({ testCase }: Props) => {
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
    formState: { isDirty },
  } = useForm<TestCaseFormData>({
    defaultValues: {
      name: testCase?.name ?? "",
      setup: "",
      estimate: "",
      scenario: "",
      expected: "",
      teardown: "",
      description: "",
      steps: [],
      is_steps: false,
      labels: [],
      attachments: [],
      suite: Number(testSuiteId),
    },
  })

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
  } = useAttachments<TestCaseFormData>(control, projectId)
  const [, setSearchParams] = useSearchParams()
  const labelProps = useTestCaseFormLabels({ setValue, testCase, isShow, isEditMode })
  const { data: treeSuites, isLoading: isLoadingTreeSuites } = useGetTestSuitesTreeViewQuery(
    { project: projectId },
    { skip: !projectId }
  )
  const navigate = useNavigate()
  useEffect(() => {
    setValue("name", "")
    if (!isShow || !testCase || !isEditMode) return

    const testCaseAttachesWithUid = testCase.attachments.map((attach) => ({
      ...attach,
      uid: String(attach.id),
    }))
    const stepsSorted = [...testCase.steps].sort((a, b) => a.sort_order - b.sort_order)
    if (testCaseAttachesWithUid.length) {
      setAttachments(testCaseAttachesWithUid)
    }
    setSteps(stepsSorted)
    setValue("name", testCase.name)
    setValue("description", testCase.description)
    setValue("setup", testCase.setup)
    setValue("scenario", !testCase.steps.length ? testCase.scenario ?? "" : "")
    setValue("expected", testCase.expected ?? "")
    setValue("teardown", testCase.teardown)
    setValue("estimate", testCase.estimate)
    setValue("steps", stepsSorted)
    setValue("is_steps", Boolean(testCase.steps.length))
    setValue("labels", testCase.labels)
    setValue("suite", Number(testCase.suite))
  }, [testCase, isEditMode, isShow])

  const flatSuites = useMemo(() => {
    if (!treeSuites) return []
    const flat: Suite[] = []
    const recurse = (node: Suite) => {
      flat.push(node)
      if (node.children) {
        node.children.forEach(recurse)
      }
    }
    treeSuites.results.forEach(recurse)
    return flat
  }, [treeSuites])

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

  const sortingSteps = (steps: SortingStep[]) => {
    const sortList = steps.sort((a: SortingStep, b: SortingStep) => a.sort_order - b.sort_order)

    return sortList.map((step, index) => ({
      ...step,
      sort_order: index + 1,
    }))
  }

  const confirmSwitchSuite = () => {
    return new Promise((resolve) => {
      Modal.confirm({
        title: "Do you want to change suite?",
        content: "Please confirm to change suite.",
        okText: "Ok",
        cancelText: "Cancel",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  }

  const onSubmit = async (data: TestCaseFormData, asCurrent = true) => {
    if (!testCase) return
    const dataForm = data as SubmitData

    const isSwitchingSuite = dataForm.suite && dataForm.suite !== Number(testSuiteId)
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
      }).unwrap()
      setSearchParams({
        version: String(newTestCase.versions[0]),
        test_case: String(testCase.id),
      })
      handleCloseModal()
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            id={String(newTestCase.id)}
            action={isEditMode ? "updated" : "created"}
            title="Test Case"
            link={`/projects/${projectId}/suites/${testSuiteId}?test_case=${newTestCase.id}`}
          />
        ),
      })
      if (dataForm.suite !== Number(testSuiteId)) {
        navigate(`/projects/${projectId}/suites/${dataForm.suite}`)
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
      showModalCloseConfirm(handleCloseModal)
      return
    }

    handleCloseModal()
  }

  const shouldShowSuiteSelect = !isLoadingTreeSuites && isEditMode
  const title = `Edit Test Case '${testCase?.name}'`

  return {
    title,
    isShow,
    isEditMode,
    isLoading: isLoading || isLoadingAttachments,
    errors,
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
    setAttachments,
    handleCancel,
    handleSubmitFormAsNew: handleSubmit(onSubmitAsNewVersion),
    handleSubmitFormAsCurrent: handleSubmit(onSubmitWithoutNewVersion),
    register,
    labelProps,
    treeSuites,
    shouldShowSuiteSelect,
    flatSuites,
  }
}
