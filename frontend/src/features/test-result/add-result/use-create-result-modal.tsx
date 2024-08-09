import { notification } from "antd"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { useAttachments } from "entities/attachment/model"

import { useCreateResultMutation } from "entities/result/api"
import { useAttributes } from "entities/result/model/use-attributes"

import { selectTest } from "entities/test/model"

import { useErrors } from "shared/hooks"
import { makeAttributesJson, showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui"

export interface CreateResultModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testCase: TestCase
}

interface ErrorData {
  status?: string
  comment?: string
  attributes?: string | null
}

export const useCreateResultModal = ({ setIsShow, testCase }: CreateResultModalProps) => {
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const [createResult, { isLoading }] = useCreateResultMutation()
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    register,
    formState: { isDirty },
    watch,
  } = useForm<ResultFormData>({
    defaultValues: {
      comment: "",
      status: "1",
      attachments: [],
      attributes: [],
      steps: [],
    },
  })
  const watchStatus = watch("status")
  const test = useAppSelector(selectTest)
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const {
    setAttachments,
    onReset,
    onRemove,
    onLoad,
    onChange,
    removeAttachmentIds,
    attachments,
    attachmentsIds,
    isLoading: isLoadingCreateAttachment,
  } = useAttachments<ResultFormData>(control, projectId)
  const {
    attributes: allAttributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    resetAttributes,
  } = useAttributes({ mode: "create", setValue })
  const attributes = allAttributes.filter(
    (attr) => attr.status_specific?.includes(Number(watchStatus))
  )
  const [steps, setSteps] = useState<Record<string, string>>({})
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    onReset()
    removeAttachmentIds()
    resetAttributes()
    reset()
  }

  const handleCancel = () => {
    if (isLoading || isLoadingCreateAttachment) {
      return
    }

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  const onSubmit: SubmitHandler<ResultFormData> = async (data) => {
    if (!test) return
    setErrors(null)

    const { isSuccess, attributesJson, errors } = makeAttributesJson(attributes)

    if (!isSuccess) {
      setErrors({ attributes: JSON.stringify(errors) })
      return
    }

    const stepsResult: { step: string; status: string }[] = []
    if (testCase.steps.length) {
      testCase.steps.forEach((step) => {
        if (!steps[step.id]) {
          stepsResult.push({ step: step.id, status: "1" })
        } else {
          stepsResult.push({ step: step.id, status: steps[step.id] })
        }
      })
    }

    try {
      const dataReq = {
        ...data,
        attributes: attributesJson,
        test: test.id,
        steps_results: stepsResult,
      }
      const newResult = await createResult({
        testPlanId: Number(testPlanId),
        body: dataReq,
      }).unwrap()
      onCloseModal()

      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action="created"
            title="Result"
            link={`/projects/${projectId}/plans/${testPlanId}/?test=${newResult.test}#result-${newResult.id}`}
            id={String(newResult.id)}
          />
        ),
      })
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  return {
    isLoading,
    isLoadingCreateAttachment,
    isDirty,
    attachments,
    attachmentsIds,
    control,
    attributes,
    steps,
    errors,
    onLoad,
    onChange,
    onRemove,
    handleSubmitForm: handleSubmit(onSubmit),
    handleCancel,
    setValue,
    register,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    setSteps,
    setAttachments,
  }
}
