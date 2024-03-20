import { useEffect } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { showModalCloseConfirm } from "shared/libs"

interface FormData {
  name: string
  scenario: string
  expected?: string
  attachments?: IAttachment[]
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
  const { projectId } = useParams<ParamProjectId>()
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
    },
  })

  const { attachments, attachmentsIds, isLoading, setAttachments, onRemove, onLoad, onChange } =
    useAttachments<FormData>(control, projectId)

  const onCloseModalSteps = () => {
    onCloseModal()
    clearErrors()
  }

  const handleClose = () => {
    if (isDirty) {
      showModalCloseConfirm(onCloseModalSteps)
      return
    }

    onCloseModalSteps()
  }

  const onSubmitForm: SubmitHandler<FormData> = ({ name, scenario, expected }) => {
    if (!step) return

    onSubmit({
      id: step.id,
      name,
      scenario,
      expected,
      sort_order: step.sort_order,
      attachments,
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
