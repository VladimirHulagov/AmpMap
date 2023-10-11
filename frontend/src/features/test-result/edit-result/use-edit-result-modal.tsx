import { notification } from "antd"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { useUpdateResultMutation } from "entities/result/api"
import { makeAttributesJson } from "entities/result/lib"

import { useErrors } from "shared/hooks"
import { makeRandomId, showModalCloseConfirm } from "shared/libs"

type ErrorData = {
  status?: string
  comment?: string
  attributes?: string | null
}

interface UseEditResultModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testResult: IResult
}

export const useEditResultModal = ({ setIsShow, testResult, isShow }: UseEditResultModalProps) => {
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    register,
    formState: { isDirty },
  } = useForm<ResultFormData>({
    mode: "all",
    defaultValues: {
      comment: testResult.comment,
      status: testResult.status,
      attributes: [],
      steps: [],
    },
  })

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
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const [updatedTestResult, { isLoading: isLoadingUpdateTestResult }] = useUpdateResultMutation()
  const [stepsResult, setStepsResult] = useState<{ [stepId: string]: string }>({})

  useEffect(() => {
    const resultSteps: { [stepId: string]: string } = {}
    testResult.steps_results.forEach((result) => {
      const stepId = String(result.id)
      resultSteps[stepId] = String(result.status)
    })
    setStepsResult(resultSteps)
  }, [testResult])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    reset()
    removeAttachmentIds()
    setAttributes([])
    onReset()
  }

  const handleCancel = () => {
    if (isLoadingUpdateTestResult || isLoadingCreateAttachment) return

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  useEffect(() => {
    if (testResult && isShow) {
      const testResultAttachesWithUid = testResult.attachments.map((attach) => ({
        ...attach,
        uid: String(attach.id),
      }))
      if (testResultAttachesWithUid.length) {
        setAttachments(testResultAttachesWithUid)
      }

      setValue("status", testResult.status)
      setValue("comment", testResult.comment)
      loadAttributeJson(testResult.attributes)
    }
  }, [testResult, isShow])

  const loadAttributeJson = (attributesJson: { [key: string]: string[] | string | object }) => {
    const _attributes: Attribute[] = []

    Object.keys(attributesJson).map((key: string) => {
      if (typeof attributesJson[key] === "string") {
        _attributes.push({
          id: makeRandomId(),
          name: key,
          type: "txt",
          value: attributesJson[key],
        })
      } else if (Array.isArray(attributesJson[key])) {
        const array: string[] = attributesJson[key] as string[]
        _attributes.push({
          id: makeRandomId(),
          name: key,
          type: "list",
          value: array.join("\r\n"),
        })
      } else if (typeof attributesJson[key] === "object") {
        _attributes.push({
          id: makeRandomId(),
          name: key,
          type: "json",
          value: JSON.stringify(attributesJson[key], null, 2),
        })
      }
    })

    setAttributes(_attributes)
    setValue("attributes", _attributes, { shouldDirty: true })
  }

  const onSubmit: SubmitHandler<ResultFormData> = async (data) => {
    if (!testResult || !testPlanId) return // TODO check it
    setErrors(null)

    const { isSuccess, attributesJson, error } = makeAttributesJson(attributes)

    if (!isSuccess) {
      setErrors({ attributes: error })
      return
    }

    const stepsResultData: { id: string; status: string }[] = []

    if (Object.keys(stepsResult).length) {
      Object.entries(stepsResult).forEach(([id, status]) => {
        stepsResultData.push({ id, status })
      })
    }

    try {
      const dataReq = {
        ...data,
        attributes: attributesJson,
        steps_results: stepsResultData,
        test: testResult.test,
      }
      await updatedTestResult({
        id: testResult.id,
        testPlanId: Number(testPlanId),
        body: dataReq,
      }).unwrap()
      onCloseModal()
      notification.success({
        message: "Success",
        description: "Test Result updated successfully",
      })
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  const handleAddAttribute = () => {
    const newAttribues = [
      ...attributes,
      { id: makeRandomId(), name: "", value: "", type: "txt" },
    ] as Attribute[]
    setAttributes(newAttribues)
    setValue("attributes", newAttribues, { shouldDirty: true })
  }

  const handleAttributeRemove = (attributeId: string) => {
    const newAttribues = attributes.filter((item: Attribute) => item.id !== attributeId)
    setAttributes(newAttribues)
    setValue("attributes", newAttribues, { shouldDirty: true })
  }

  const handleAttributeChangeName = (attributeId: string, name: string) => {
    const newAttribues = attributes.map((attribute) => {
      if (attribute.id !== attributeId) return attribute
      return {
        ...attribute,
        name,
      }
    })
    setAttributes(newAttribues)
    setValue("attributes", newAttribues, { shouldDirty: true })
  }

  const handleAttributeChangeValue = (attributeId: string, value: string) => {
    const newAttribues = attributes.map((attribute) => {
      if (attribute.id !== attributeId) return attribute
      return {
        ...attribute,
        value,
      }
    })
    setAttributes(newAttribues)
    setValue("attributes", newAttribues, { shouldDirty: true })
  }

  const handleAttributeChangeType = (attributeId: string, type: "txt" | "list" | "json") => {
    const newAttribues = attributes.map((attribute) => {
      if (attribute.id !== attributeId) return attribute
      return {
        ...attribute,
        type,
      }
    })
    setAttributes(newAttribues)
    setValue("attributes", newAttribues, { shouldDirty: true })
  }

  return {
    isLoadingCreateAttachment,
    isLoadingUpdateTestResult,
    errors,
    control,
    attachments,
    attachmentsIds,
    attributes,
    stepsResult,
    isDirty,
    setAttachments,
    setStepsResult,
    handleAttachmentsChange: onChange,
    handleAttachmentsLoad: onLoad,
    handleAttachmentsRemove: onRemove,
    setValue,
    handleCancel,
    register,
    handleAttributeChangeName,
    handleAttributeChangeType,
    handleAttributeChangeValue,
    handleAttributeRemove,
    handleAddAttribute,
    handleSubmitForm: handleSubmit(onSubmit),
  }
}
