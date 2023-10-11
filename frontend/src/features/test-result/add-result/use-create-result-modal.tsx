import { notification } from "antd"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { useAttachments } from "entities/attachment/model"

import { useCreateResultMutation } from "entities/result/api"
import { makeAttributesJson } from "entities/result/lib"
import { useAttributes } from "entities/result/model/use-attributes"

import { selectTest } from "entities/test/model"

import { useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"

export type CreateResultModalProps = {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testCase: ITestCase
}

type ErrorData = {
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
  } = useForm<ResultFormData>({
    defaultValues: {
      comment: "",
      status: "1",
      attachments: [],
      attributes: [],
      steps: [],
    },
  })
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
    attributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    setAttributes,
  } = useAttributes({ setValue })

  const [steps, setSteps] = useState<{ [stepId: string]: string }>({})
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    onReset()
    removeAttachmentIds()
    setAttributes([])
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
    if (!test) return // TODO check it
    setErrors(null)

    const { isSuccess, attributesJson, error } = makeAttributesJson(attributes)

    if (!isSuccess) {
      setErrors({ attributes: error })
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
      await createResult({
        testPlanId: Number(testPlanId),
        body: dataReq,
      }).unwrap()
      onCloseModal()
      notification.success({
        message: "Success",
        description: "Result created successfully",
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
