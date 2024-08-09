import { notification } from "antd"
import dayjs from "dayjs"
import React, { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

import { useGetParametersQuery } from "entities/parameter/api"

import { useCreateTestPlanMutation } from "entities/test-plan/api"
import { getTestCaseChangeResult } from "entities/test-plan/lib"

import { makeParametersForTreeView, showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { ModalForm, useTestPlanCommonModal } from "./use-test-plan-common-modal"

type IForm = ModalForm<TestPlanCreate>

interface UseTestPlanCreateModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testPlan?: TestPlan
}

const defaultValues: { defaultValues: Partial<IForm> } = {
  defaultValues: {
    name: "",
    description: "",
    test_cases: [],
    parameters: [],
    parent: null,
    started_at: dayjs(),
    due_date: dayjs().add(1, "day"),
  },
}

export const useTestPlanCreateModal = ({
  isShow,
  setIsShow,
  testPlan,
}: UseTestPlanCreateModalProps) => {
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty, errors: formErrors },
    watch,
  } = useForm<IForm>(defaultValues)
  const testCasesWatch = watch("test_cases")

  const [parametersTreeView, setParametersTreeView] = useState<IParameterTreeView[]>([])

  const [createTestPlan, { isLoading: isLoadingCreateTestPlan }] = useCreateTestPlanMutation()

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
    isLoading: isLoadingTreeData,
    onSearch,
    onRowExpand,
    onClearSearch,
    handleSearchTestPlan,
  } = useTestPlanCommonModal({ isShow })

  const { data: parameters } = useGetParametersQuery(Number(projectId), {
    skip: !projectId,
  })

  useEffect(() => {
    if (!isShow || !testPlan) return
    setSelectedParent({ value: testPlan.id, label: testPlan.name })
    setValue("parent", testPlan.id)
  }, [testPlan, isShow])

  useEffect(() => {
    if (parameters) {
      setParametersTreeView(makeParametersForTreeView(parameters))
    }
  }, [parameters])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    reset()
    onClearSearch()
  }

  const handleClose = () => {
    if (isLoadingCreateTestPlan) {
      return
    }

    if (isDirty) {
      showModalCloseConfirm(onCloseModal)
      return
    }

    onCloseModal()
  }

  const onSubmit: SubmitHandler<IForm> = async (data) => {
    setErrors(null)
    try {
      const newTestCases = data.test_cases?.filter((item) => !item.startsWith("TS"))
      const newTestPlan = await createTestPlan({
        ...data,
        test_cases: newTestCases,
        project: Number(projectId),
      }).unwrap()
      onCloseModal()
      notification.success({
        message: "Success",
        description: (
          <AlertSuccessChange
            id={String(newTestPlan[0].id)}
            action="created"
            title="Test Plan"
            link={`/projects/${projectId}/plans/${newTestPlan[0].id}`}
          />
        ),
      })
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  const handleSelectTestPlan = (value?: SelectData) => {
    setErrors({ parent: "" })
    if (Number(value?.value) === Number(testPlan?.id)) {
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
    isLoadingCreateTestPlan,
    isDirty,
    errors,
    formErrors,
    control,
    searchText,
    expandedRowKeys,
    treeData,
    parametersTreeView,
    selectedParent,
    isLastPage,
    isLoadingTreeData,
    isLoadingTestPlans,
    dataTestPlans,
    handleRowExpand: onRowExpand,
    handleSearch: onSearch,
    handleSubmitForm: handleSubmit(onSubmit),
    handleClose,
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
