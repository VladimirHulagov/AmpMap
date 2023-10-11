import { notification } from "antd"
import moment, { Moment } from "moment"
import React, { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useGetParametersQuery } from "entities/parameter/api"

import { useGetTestSuitesTreeViewWithCasesQuery } from "entities/suite/api"

import { useCreateTestPlanMutation, useLazyGetTestPlanQuery } from "entities/test-plan/api"
import { getTestCaseChangeResult } from "entities/test-plan/lib"
import { useTestPlanSearch } from "entities/test-plan/model/use-test-plan-search"

import { useDatepicker, useErrors } from "shared/hooks"
import {
  makeParametersForTreeView,
  makeTestSuitesForTreeView,
  showModalCloseConfirm,
} from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

type ErrorData = {
  name?: string
  description?: string
  parent?: string
  parameters?: string
  test_cases?: string
  started_at?: string
  due_date?: string
}

type IForm = Modify<
  ITestPlanCreate,
  {
    test_cases: string[]
    started_at: Moment
    due_date: Moment
  }
>

interface UseTestPlanCreateModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
}

export const useTestPlanCreateModal = ({ isShow, setIsShow }: UseTestPlanCreateModalProps) => {
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
    watch,
  } = useForm<IForm>({
    defaultValues: {
      name: "",
      description: "",
      test_cases: [],
      parameters: [],
      parent: undefined,
      started_at: moment(),
      due_date: moment().add(1, "day"),
    },
  })
  const testCasesWatch = watch("test_cases")

  const [testSuites, setTestSuites] = useState<ISuite[]>([])
  const [parametersTreeView, setParametersTreeView] = useState<IParameterTreeView[]>([])

  const { searchText, filterTable, expandedRowKeys, onSearch, onRowExpand, onClearSearch } =
    useTestPlanSearch()
  const [createTestPlan, { isLoading: isLoadingCreateTestPlan }] = useCreateTestPlanMutation()
  const [getTestPlan] = useLazyGetTestPlanQuery()
  const { data: testSuitesTreeView } = useGetTestSuitesTreeViewWithCasesQuery(
    {
      project: projectId,
    },
    {
      skip: !projectId,
    }
  )
  const { data: parameters } = useGetParametersQuery(Number(projectId), {
    skip: !projectId,
  })
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const { setDateFrom, setDateTo, disabledDateFrom, disabledDateTo } = useDatepicker()

  const [selectedParent, setSelectedParent] = useState<{ label: string; value: number } | null>(
    null
  )

  useEffect(() => {
    if (!isShow || !testPlanId) return
    getTestPlan(Number(testPlanId))
      .unwrap()
      .then((res) => {
        setSelectedParent({ value: res.id, label: res.name })
        setValue("parent", res.id)
      })
  }, [testPlanId, isShow])

  useEffect(() => {
    if (testSuitesTreeView) {
      setTestSuites(makeTestSuitesForTreeView(testSuitesTreeView.results))
    }
  }, [testSuitesTreeView])

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

  const handleSelectParent = (value?: { label: string; value: number }) => {
    setErrors({ parent: "" })
    if (Number(value?.value) === Number(testPlanId)) {
      setErrors({ parent: "Test Plan не может быть родителем для самого себя." })
      return
    }

    if (value) {
      setValue("parent", value.value, { shouldDirty: true })
      setSelectedParent({ value: value.value, label: value.label })
    }
  }

  const handleClearParent = () => {
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
    control,
    searchText,
    expandedRowKeys,
    testSuites,
    filterTable,
    parametersTreeView,
    selectedParent,
    handleRowExpand: onRowExpand,
    handleSearch: onSearch,
    handleSubmitForm: handleSubmit(onSubmit),
    handleClose,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    setValue,
    handleSelectParent,
    handleClearParent,
    handleTestCaseChange,
  }
}
