import { notification } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

import { useTestsTableParams } from "entities/test/model"

import { useGetTestPlanCasesQuery, useUpdateTestPlanMutation } from "entities/test-plan/api"
import { getTestCaseChangeResult } from "entities/test-plan/lib"

import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalForm, useTestPlanCommonModal } from "../create-test-plan/use-test-plan-common-modal"

type IForm = ModalForm<TestPlanUpdate>

interface UseTestPlanEditModalProps {
  testPlan: TestPlan
  isShow: boolean
  setIsShow: (isShow: boolean) => void
}

export const useTestPlanEditModal = ({
  testPlan,
  isShow,
  setIsShow,
}: UseTestPlanEditModalProps) => {
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { isDirty, errors: formErrors },
  } = useForm<IForm>()
  const testCasesWatch = watch("test_cases")

  const { data: tests, isLoading: isLoadingTestCases } = useGetTestPlanCasesQuery(
    {
      testPlanId: String(testPlan.id),
    },
    { skip: !isShow }
  )
  const [updateTestPlan, { isLoading: isLoadingUpdate }] = useUpdateTestPlanMutation()
  const { trigger } = useTestsTableParams()

  const {
    selectedLables,
    labelProps,
    lableCondition,
    handleConditionClick,
    showArchived,
    handleToggleArchived,
    projectId,
    errors,
    setErrors,
    isLastPage,
    isLoadingTestPlans,
    dataTestPlans,
    onHandleError,
    selectedParent,
    setSelectedParent,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    handleLoadNextPageData,
    searchText,
    treeData,
    expandedRowKeys,
    isLoading: isLoadingSearch,
    onSearch,
    onRowExpand,
    onClearSearch,
    handleSearchTestPlan,
  } = useTestPlanCommonModal({ isShow })

  useEffect(() => {
    if (!isShow || !tests) return
    const ids = tests.case_ids.map((i) => String(i))
    setValue("test_cases", ids)
  }, [testPlan, isShow, tests])

  useEffect(() => {
    if (!isShow) return
    setValue("name", testPlan.name)
    setValue("description", testPlan.description)
    setValue("started_at", dayjs(testPlan.started_at))
    setDateFrom(dayjs(testPlan.started_at))
    setValue("due_date", dayjs(testPlan.due_date))
    setDateTo(dayjs(testPlan.due_date))

    if (testPlan.parent) {
      setSelectedParent({ value: testPlan.parent.id, label: testPlan.parent.name })
      setValue("parent", testPlan.parent.id)
    }
  }, [testPlan, isShow])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    onClearSearch()
    handleClearTestPlan()
    reset()
  }

  const handleClose = () => {
    if (isLoadingTestCases) return

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  const onSubmit: SubmitHandler<IForm> = async (data) => {
    setErrors(null)
    const newTestCases = data.test_cases?.filter((item) => !item.startsWith("TS"))
    try {
      await updateTestPlan({
        id: testPlan.id,
        body: {
          ...data,
          due_date: dayjs(data.due_date).format("YYYY-MM-DDThh:mm"),
          started_at: dayjs(data.started_at).format("YYYY-MM-DDThh:mm"),
          parent: data.parent ?? null,
          test_cases: newTestCases,
        },
      }).unwrap()
      trigger()
      onCloseModal()
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            id={String(testPlan.id)}
            action="updated"
            title="Test Plan"
            link={`/projects/${projectId}/plans/${testPlan.id}`}
          />
        ),
      })
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleSelectTestPlan = (value?: SelectData) => {
    setErrors({ parent: "" })
    if (value?.value === testPlan.id) {
      setErrors({ parent: "Test Plan не может быть родителем для самого себя." })
      return
    }

    if (value) {
      setValue("parent", value.value, { shouldDirty: true })
      setSelectedParent({ value: value.value, label: value.label?.toString() ?? "" })
    }
  }

  const handleClearTestPlan = () => {
    setSelectedParent(null)
    setValue("parent", null, { shouldDirty: true })
  }

  const handleTestCaseChange = (checked: CheckboxChecked, info: TreeCheckboxInfo) => {
    const result = getTestCaseChangeResult(checked, info, testCasesWatch)
    setValue("test_cases", result, { shouldDirty: true })
  }

  return {
    errors,
    formErrors,
    control,
    selectedParent,
    searchText,
    treeData,
    expandedRowKeys,
    isDirty,
    isLoadingTestCases,
    isLoadingUpdate,
    isLoadingTestPlans,
    isLoadingSearch,
    isLastPage,
    dataTestPlans,
    handleClose,
    handleRowExpand: onRowExpand,
    handleSubmitForm: handleSubmit(onSubmit),
    handleSearch: onSearch,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    setValue,
    handleTestCaseChange,
    handleClearTestPlan,
    handleSearchTestPlan,
    handleSelectTestPlan,
    handleLoadNextPageData,
    selectedLables,
    labelProps,
    lableCondition,
    handleConditionClick,
    showArchived,
    handleToggleArchived,
  }
}
