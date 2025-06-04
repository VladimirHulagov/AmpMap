import { useEffect } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

import { useAttachments } from "entities/attachment/model"

import { useProjectContext } from "pages/project"

import { antdModalCloseConfirm } from "shared/libs/antd-modals"

interface FormData {
  name: string
  scenario: string
  expected?: string
  attachments?: IAttachment[]
  isNew?: boolean
}

export interface TestCaseStepsModalProps {
  isEdit: boolean
  step: Step | null
  onCloseModal: () => void
  onSubmit: (step: Step) => void
}

export const useTestCaseStepsModal = ({
  step,
  onSubmit,
  onCloseModal,
}: TestCaseStepsModalProps) => {
  const project = useProjectContext()
  const {
    handleSubmit,
    control,
    setValue,
    register,
    clearErrors,
    formState: { isDirty, errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      scenario: "",
      expected: "",
      attachments: [],
      isNew: true,
    },
  })

  const { attachments, attachmentsIds, isLoading, setAttachments, onRemove, onLoad, onChange } =
    useAttachments<FormData>(control, project.id)

  const onCloseModalSteps = () => {
    onCloseModal()
    clearErrors()
  }

  const handleClose = () => {
    if (isDirty) {
      antdModalCloseConfirm(onCloseModalSteps)
      return
    }

    onCloseModalSteps()
  }

  const onSubmitForm: SubmitHandler<FormData> = ({ name, scenario, expected, isNew }) => {
    if (!step) return

    onSubmit({
      id: step.id,
      name,
      scenario,
      expected,
      sort_order: step.sort_order,
      attachments,
      isNew: !!isNew,
    })
  }

  useEffect(() => {
    if (!step) return
    const testResultAttachesWithUid = step.attachments.map((attach) => ({
      ...attach,
      uid: String(attach.id),
    }))

    setValue("name", step.name)
    setValue("scenario", step.scenario)
    setValue("expected", step.expected)
    setValue("isNew", step.isNew)
    setAttachments(testResultAttachesWithUid)
    clearErrors()
  }, [step])

  return {
    handleClose,
    handleSubmit,
    onSubmitForm,
    isLoading,
    isDirty,
    errors,
    control,
    onLoad,
    attachments,
    setAttachments,
    attachmentsIds,
    setValue,
    onChange,
    register,
    onRemove,
  }
}
