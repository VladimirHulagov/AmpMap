import { notification } from "antd"
import { useStatuses } from "entities/status/model/use-statuses"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { useCreateResultMutation, useUpdateResultMutation } from "entities/result/api"
import { useAttributes } from "entities/result/model"

import { useErrors } from "shared/hooks"
import { makeAttributesJson, showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui"

import { filterAttributesByStatus } from "../utils"

interface ErrorData {
  status?: string
  comment?: string
  attributes?: string | null
}

interface UseEditResultModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testResult: IResult
  isClone: boolean
}

export const useEditCloneResultModal = ({
  setIsShow,
  testResult,
  isShow,
  isClone,
}: UseEditResultModalProps) => {
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    register,
    formState: { isDirty },
    watch,
  } = useForm<ResultFormData>({
    mode: "all",
    defaultValues: {
      comment: testResult.comment,
      status: null,
      attributes: [],
      steps: [],
    },
  })
  const watchStatus = watch("status")

  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const { statuses, getStatusById, defaultStatus } = useStatuses({ project: projectId })
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
  const [createResult, { isLoading: isLoadingCreateTestResult }] = useCreateResultMutation()
  const [stepsResult, setStepsResult] = useState<Record<string, number>>({})
  const isLoading =
    isLoadingUpdateTestResult || isLoadingCreateTestResult || isLoadingCreateAttachment

  const {
    attributes: allAttributes,
    setAttributes,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    loadAttributeJson,
  } = useAttributes({ mode: "edit", setValue })
  const attributes = filterAttributesByStatus(allAttributes, statuses, watchStatus)

  const isStatusAvailable = (status: number) => !!getStatusById(status)

  useEffect(() => {
    const resultSteps: Record<string, number> = {}
    testResult.steps_results.forEach((result) => {
      const stepId = String(result.id)
      if (isStatusAvailable(result.status)) {
        resultSteps[stepId] = result.status
      }
    })

    setStepsResult(resultSteps)
  }, [testResult, statuses])

  useEffect(() => {
    const shouldSetDefaultStatus = defaultStatus && !watchStatus && isShow
    if (shouldSetDefaultStatus) {
      setValue("status", defaultStatus.id, { shouldDirty: true })

      const newSteps = testResult.steps_results.reduce(
        (acc, result) => {
          if (result.id) {
            acc[result.id] = isStatusAvailable(result.status) ? result.status : defaultStatus.id
          }
          return acc
        },
        {} as Record<string, number>
      )

      setStepsResult(newSteps)
    }
  }, [defaultStatus, isShow, watchStatus, testResult.steps_results])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    reset()
    removeAttachmentIds()
    setAttributes([])
    onReset()
  }

  const handleCancel = () => {
    if (isLoading) return

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  useEffect(() => {
    if (testResult && isShow && statuses.length) {
      const testResultAttachesWithUid = testResult.attachments.map((attach) => ({
        ...attach,
        uid: String(attach.id),
      }))
      if (testResultAttachesWithUid.length && !isClone) {
        setAttachments(testResultAttachesWithUid)
      }

      const isStatusExist = !!getStatusById(testResult.status)
      if (isStatusExist) {
        setValue("status", testResult.status)
      }

      setValue("comment", testResult.comment)
      loadAttributeJson(testResult.attributes)
    }
  }, [testResult, isShow, isClone, statuses])

  const onSubmit: SubmitHandler<ResultFormData> = async (data) => {
    if (!testResult || !testPlanId) return
    setErrors(null)

    const { isSuccess, attributesJson, errors } = makeAttributesJson(attributes)

    if (!isSuccess) {
      setErrors({ attributes: JSON.stringify(errors) })
      return
    }

    const stepsResultData: { id: string; status: number }[] = []

    if (Object.keys(stepsResult).length) {
      Object.entries(stepsResult).forEach(([id, status]) => {
        stepsResultData.push({ id, status: status })
      })
    }

    try {
      const dataReq = {
        ...data,
        attributes: attributesJson,
        steps_results: stepsResultData,
        test: testResult.test,
      }
      let newResult = null
      if (!isClone) {
        newResult = await updatedTestResult({
          id: testResult.id,
          testPlanId: Number(testPlanId),
          body: dataReq as IResultUpdate,
        }).unwrap()
      } else {
        const findStep = (id: string) =>
          testResult.steps_results.find((i) => i.id === parseInt(id))?.step
        const stepsResultCreate = stepsResultData
          .map((i) => {
            return { step: findStep(i.id)?.toString(), status: i.status }
          })
          .filter((i) => i.step !== undefined) as StepResultCreate[]
        newResult = await createResult({
          testPlanId: Number(testPlanId),
          body: { ...dataReq, steps_results: stepsResultCreate } as IResultCreate,
        }).unwrap()
      }
      onCloseModal()

      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            action="updated"
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

  const isAllStepsSelected = testResult.steps_results.every((result) => stepsResult[result.id])
  const isDisabledSubmit = !isDirty || !isAllStepsSelected || !watchStatus

  return {
    isLoading,
    errors,
    control,
    attachments,
    attachmentsIds,
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
    attributes,
    setAttributes,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    handleSubmitForm: handleSubmit(onSubmit),
    statuses,
    isDisabledSubmit,
  }
}
