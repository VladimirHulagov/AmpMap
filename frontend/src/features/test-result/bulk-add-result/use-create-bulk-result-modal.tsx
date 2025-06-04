import { useGetBulkAddResultCustomAttributeQuery } from "entities/custom-attribute/api"
import { useStatuses } from "entities/status/model/use-statuses"
import { useEffect, useLayoutEffect, useState } from "react"
import { FieldPath, SubmitHandler, useFieldArray, useForm } from "react-hook-form"

import { useProjectContext } from "pages/project"

import { useErrors } from "shared/hooks"

interface Props {
  onSubmit: (formData: AddBulkResultFormData) => Promise<void>
  getBulkRequestData: () => TestBulkUpdate
  isShow: boolean
  onClose: () => void
}

interface ErrorData {
  status?: string
}

const steps = ["status", "common", "specific", "additional"] as const

type StepsType = (typeof steps)[number] | "specific_bulk"

export const getCommonFieldPath = (index: number): CommonFieldPath =>
  `non_suite_specific.${index}.value`

export const getSuiteSpecificFieldPath = (index: number): SuiteSpecificFieldPath =>
  `suite_specific.${index}.value`

export const getBulkSuiteSpecificFieldPath = (index: number): BulkSuiteSpecificFieldPath =>
  `bulk_suite_specific.${index}.value`

export const useCreateBulkResultModal = ({
  onSubmit,
  onClose,
  isShow,
  getBulkRequestData,
}: Props) => {
  const project = useProjectContext()
  const { statuses, isLoading: isLoadingStatuses } = useStatuses({ project: project.id })
  const [isLoading, setIsLoading] = useState(false)

  const [step, setStep] = useState<StepsType>("status")
  const [validationFields, setValidationFields] = useState<
    Record<StepsType, FieldPath<AddBulkResultFormData>[]>
  >({
    status: ["status"],
    common: [],
    specific: [],
    specific_bulk: [],
    additional: [],
  })
  const [, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const {
    control,
    watch,
    handleSubmit,
    trigger,
    register,
    reset,
    formState: { errors: formErrors },
  } = useForm<AddBulkResultFormData>({
    defaultValues: {
      comment: "",
      status: null,
      attachments: [],
      non_suite_specific: [],
      suite_specific: [],
      is_bulk_suite_specific: true,
    },
  })

  const status = watch("status")
  const isBulkApplying = watch("is_bulk_suite_specific")

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { filter_conditions, plan_id, assignee_id, ...bulkRequestData } = getBulkRequestData()

  const getTriggeredFields = () => {
    if (step === "specific" && isBulkApplying) {
      return validationFields.specific_bulk
    }

    return validationFields[step]
  }

  const {
    data: customAttributes,
    isFetching: isLoadingAttributes,
    error,
  } = useGetBulkAddResultCustomAttributeQuery(
    {
      ...bulkRequestData,
      ...(filter_conditions ?? {}),
      status_id: Number(status),
      project_id: Number(project.id),
    },
    {
      skip: !status || !project,
    }
  )

  useEffect(() => {
    if (error) {
      onHandleError(error, true)
    }
  }, [error])

  useLayoutEffect(() => {
    if (!customAttributes) {
      return
    }

    customAttributes.non_suite_specific.forEach(({ name, is_required }, index) => {
      appendCommonField({ label: name, is_required, value: "" })

      setValidationFields((prevState) => ({
        ...prevState,
        common: [...prevState.common, getCommonFieldPath(index)],
      }))
    })

    const uniqueAttributes: BulkSuiteSpecificFormField[] = []

    customAttributes.suite_specific.forEach(({ suite_id, values }) => {
      values.forEach(({ name, is_required }, index) => {
        appendSpecificField({ label: name, value: "", suite_id, is_required })

        if (!uniqueAttributes.some(({ label }) => label === name)) {
          uniqueAttributes.push({ label: name, value: "", is_required })
        }

        setValidationFields((prevState) => ({
          ...prevState,
          specific: [...prevState.specific, getSuiteSpecificFieldPath(index)],
        }))
      })
    })

    appendBulkSuiteSpecific(uniqueAttributes)

    uniqueAttributes.forEach((_, index) => {
      setValidationFields((prevState) => ({
        ...prevState,
        specific_bulk: [...prevState.specific_bulk, getBulkSuiteSpecificFieldPath(index)],
      }))
    })

    return () => {
      removeCommonField()
      removeSpecificField()
      removeBulkSuiteSpecific()
      setValidationFields({
        common: [],
        specific: [],
        specific_bulk: [],
        status: ["status"],
        additional: [],
      })
    }
  }, [customAttributes])

  useEffect(() => {
    reset()
    setStep("status")
  }, [isShow])

  const {
    fields: commonFields,
    append: appendCommonField,
    remove: removeCommonField,
  } = useFieldArray({
    control,
    name: "non_suite_specific",
  })

  const {
    fields: specificFields,
    append: appendSpecificField,
    remove: removeSpecificField,
  } = useFieldArray({
    control,
    name: "suite_specific",
  })

  const {
    fields: bulkSuiteSpecific,
    append: appendBulkSuiteSpecific,
    remove: removeBulkSuiteSpecific,
  } = useFieldArray({
    control,
    name: "bulk_suite_specific",
  })

  const onSubmitForm: SubmitHandler<AddBulkResultFormData> = async (data) => {
    setErrors(null)

    try {
      setIsLoading(true)
      await onSubmit(data)

      onClose()
    } catch (err) {
      onHandleError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    const currentIndex = steps.findIndex((item) => item === step)

    if (currentIndex === -1) {
      return
    }

    if (await trigger(getTriggeredFields())) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handlePrev = () => {
    const currentIndex = steps.findIndex((item) => item === step)

    if (currentIndex === -1) {
      return
    }

    setStep(steps[currentIndex - 1])
  }

  return {
    control,
    currentStep: step,
    handlePrev,
    handleNext,
    handleSubmitForm: handleSubmit(onSubmitForm),
    statuses,
    formErrors,
    commonFields,
    specificFields,
    bulkSuiteSpecific,
    suiteSpecificFieldsData: customAttributes?.suite_specific ?? [],
    project,
    isLoading,
    isLoadingStatuses,
    isLoadingAttributes,
    register,
    isBulkApplying,
  }
}
