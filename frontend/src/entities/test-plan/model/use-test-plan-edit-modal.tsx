import { notification } from "antd"
import moment, { Moment } from "moment"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useLazyGetTestSuitesTreeViewWithCasesQuery } from "entities/suite/api"

import { useTestsTableParams } from "entities/test/model"

import { useDatepicker, useErrors } from "shared/hooks"
import { makeTestSuitesForTreeView, showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import {
  useGetTestPlanCasesQuery,
  useLazyGetTestPlanQuery,
  useUpdateTestPlanMutation,
} from "../api"
import { useTestPlanSearch } from "./use-test-plan-search"

type ErrorData = {
  name?: string
  description?: string
  parent?: string
  test_cases?: string
  started_at?: string
  due_date?: string
}

type IForm = Modify<
  ITestPlanUpdate,
  {
    test_cases: string[]
    started_at: Moment
    due_date: Moment
  }
>

interface UseTestPlanEditModalProps {
  testPlan: ITestPlanTreeView
  isShow: boolean
  setIsShow: (isShow: boolean) => void
}

export const useTestPlanEditModal = ({
  testPlan,
  isShow,
  setIsShow,
}: UseTestPlanEditModalProps) => {
  const [testSuites, setTestSuites] = useState<ISuite[]>([])
  const { projectId } = useParams<ParamProjectId>()
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<IForm>()
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const { searchText, filterTable, expandedRowKeys, onSearch, onRowExpand, onClearSearch } =
    useTestPlanSearch()
  const [selectedParent, setSelectedParent] = useState<{ label: string; value: number } | null>(
    null
  )

  const { setDateFrom, setDateTo, disabledDateFrom, disabledDateTo } = useDatepicker()
  const [getTestPlan, { isLoading: isLoadingGetTestPlan }] = useLazyGetTestPlanQuery()
  const [getTestSuitesTreeView, { data: testSuitesTreeView, isLoading: isLoadingSuitesTreeView }] =
    useLazyGetTestSuitesTreeViewWithCasesQuery()
  const { data: tests, isLoading: isLoadingTestPlanCases } = useGetTestPlanCasesQuery({
    testPlanId: String(testPlan.id),
  })
  const [updateTestPlan, { isLoading: isLoadingUpdate }] = useUpdateTestPlanMutation()
  const { trigger } = useTestsTableParams()

  const isLoadingFetch = isLoadingSuitesTreeView || isLoadingTestPlanCases || isLoadingGetTestPlan

  useEffect(() => {
    if (!isShow || !tests) return
    setValue("name", testPlan.name)
    setValue("description", testPlan.description)
    setValue("started_at", moment(testPlan.started_at))
    setDateFrom(moment(testPlan.started_at))
    setValue("due_date", moment(testPlan.due_date))
    setDateTo(moment(testPlan.due_date))

    if (testPlan.parent) {
      getTestPlan(testPlan.parent)
        .unwrap()
        .then((res) => {
          setSelectedParent({ value: res.id, label: res.name })
          setValue("parent", res.id)
        })
    }

    getTestSuitesTreeView({ project: projectId || "" })

    if (testSuitesTreeView) {
      setTestSuites(makeTestSuitesForTreeView(testSuitesTreeView))
    }

    const ids = tests.case_ids.map((i) => String(i))
    setValue("test_cases", ids)
  }, [testPlan, isShow, testSuitesTreeView, tests])

  const onCloseModal = () => {
    setIsShow(false)
    setErrors(null)
    onClearSearch()
    handleClearParent()
    reset()
  }

  const handleClose = () => {
    if (isLoadingFetch || isLoadingUpdate) return

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
          due_date: moment(data.due_date).format("YYYY-MM-DDThh:mm"),
          started_at: moment(data.started_at).format("YYYY-MM-DDThh:mm"),
          parent: data.parent || null,
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

  const handleSelectParent = (value?: { label: string; value: number }) => {
    setErrors({ parent: "" })
    if (value?.value === testPlan.id) {
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

  return {
    errors,
    control,
    selectedParent,
    testSuites,
    searchText,
    filterTable,
    expandedRowKeys,
    isDirty,
    isLoadingFetch,
    isLoadingUpdate,
    handleClose,
    handleClearParent,
    handleSelectParent,
    handleRowExpand: onRowExpand,
    handleSubmitForm: handleSubmit(onSubmit),
    handleSearch: onSearch,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    setValue,
  }
}
