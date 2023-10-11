import { notification } from "antd"
import moment, { Moment } from "moment"
import React, { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useGetParametersQuery } from "entities/parameter/api"

import { useGetTestSuitesTreeViewWithCasesQuery } from "entities/suite/api"

import { useDatepicker, useErrors } from "shared/hooks"
import {
  makeParametersForTreeView,
  makeTestSuitesForTreeView,
  showModalCloseConfirm,
} from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { useCreateTestPlanMutation } from "../api"
import { useTestPlanSearch } from "./use-test-plan-search"

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

  const [testSuites, setTestSuites] = useState<ISuite[]>([])
  const [parametersTreeView, setParametersTreeView] = useState<IParameterTreeView[]>([])

  const { searchText, filterTable, expandedRowKeys, onSearch, onRowExpand, onClearSearch } =
    useTestPlanSearch()
  const [createTestPlan, { isLoading }] = useCreateTestPlanMutation()
  const { data: testSuitesTreeView } = useGetTestSuitesTreeViewWithCasesQuery({
    project: projectId || "",
  })
  const { data: parameters } = useGetParametersQuery(Number(projectId))
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const { setDateFrom, setDateTo, disabledDateFrom, disabledDateTo } = useDatepicker()

  useEffect(() => {
    if (!testPlanId) return
    setValue("parent", Number(testPlanId))
  }, [testPlanId, isShow])

  useEffect(() => {
    if (testSuitesTreeView) {
      setTestSuites(makeTestSuitesForTreeView(testSuitesTreeView))
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
    if (isLoading) {
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

  return {
    isLoading,
    isDirty,
    errors,
    control,
    searchText,
    expandedRowKeys,
    testSuites,
    filterTable,
    parametersTreeView,
    handleRowExpand: onRowExpand,
    handleSearch: onSearch,
    handleSubmitForm: handleSubmit(onSubmit),
    handleClose,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    setValue,
  }
}
