import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { showModalCloseConfirm } from "shared/libs"

type ErrorData = {
  name?: string
  scenario?: string
  expected?: string
}

interface FormData {
  name: string
  scenario: string
  expected?: string
  attachments?: IAttachment[]
}

export type TestCaseStepsModalProps = {
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
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    control,
    setValue,
    register,
    formState: { isDirty },
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
    setErrors(null)
  }

  const handleClose = () => {
    if (isDirty) {
      showModalCloseConfirm(onCloseModalSteps)
      return
    }

    onCloseModalSteps()
  }

  const onSubmitForm: SubmitHandler<FormData> = async ({ name, scenario, expected }) => {
    if (!step) return

    if (!name) {
      setErrors({ name: "Это поле не может быть пустым." })
      return
    }

    if (!scenario) {
      setErrors({ scenario: "Это поле не может быть пустым." })
      return
    }

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
    setErrors(null)
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
