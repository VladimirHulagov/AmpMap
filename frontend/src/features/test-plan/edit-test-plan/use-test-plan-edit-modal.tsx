import { notification } from "antd"
import moment, { Moment } from "moment"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useTestsTableParams } from "entities/test/model"

import { useTestCasesSearch } from "entities/test-case/model"

import {
  useGetTestPlanCasesQuery,
  useLazyGetTestPlansQuery,
  useUpdateTestPlanMutation,
} from "entities/test-plan/api"
import { getTestCaseChangeResult } from "entities/test-plan/lib"

import { useDatepicker, useErrors } from "shared/hooks"
import { showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { useSearchField } from "widgets/search-field"

interface ErrorData {
  name?: string
  description?: string
  parent?: string
  test_cases?: string
  started_at?: string
  due_date?: string
}

type IForm = Modify<
  TestPlanUpdate,
  {
    test_cases: string[]
    started_at: Moment
    due_date: Moment
  }
>

interface UseTestPlanEditModalProps {
  testPlan: TestPlanTreeView
  isShow: boolean
  setIsShow: (isShow: boolean) => void
}

export const useTestPlanEditModal = ({
  testPlan,
  isShow,
  setIsShow,
}: UseTestPlanEditModalProps) => {
  const { projectId } = useParams<ParamProjectId>()
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<IForm>()
  const testCasesWatch = watch("test_cases")
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const {
    isLoading: isLoadingSearch,
    searchText,
    treeData,
    expandedRowKeys,
    onSearch,
    onRowExpand,
    onClearSearch,
  } = useTestCasesSearch({ isShow })
  const [selectedParent, setSelectedParent] = useState<{ label: string; value: number } | null>(
    null
  )
  const { setDateFrom, setDateTo, disabledDateFrom, disabledDateTo } = useDatepicker()

  const { data: tests, isLoading: isLoadingTestCases } = useGetTestPlanCasesQuery(
    {
      testPlanId: String(testPlan.id),
    },
    { skip: !isShow }
  )
  const [updateTestPlan, { isLoading: isLoadingUpdate }] = useUpdateTestPlanMutation()
  const { trigger } = useTestsTableParams()

  const {
    search,
    paginationParams,
    handleSearch: handleSearchField,
    handleLoadNextPageData,
  } = useSearchField()

  const [getPlans] = useLazyGetTestPlansQuery()
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoadingTestPlans, setIsLoadingTestPlans] = useState(false)
  const [dataTestPlans, setDataTestPlans] = useState<TestPlan[]>([])

  const handleSearchTestPlan = (value?: string) => {
    setDataTestPlans([])
    setIsLastPage(false)
    handleSearchField(value)
  }

  const fetchPlans = async () => {
    setIsLoadingTestPlans(true)
    const res = await getPlans({
      search,
      projectId,
      page: paginationParams.page,
      page_size: paginationParams.page_size,
      is_flat: true,
    }).unwrap()
    setDataTestPlans((prevState) => [...prevState, ...res.results])
    setIsLoadingTestPlans(false)

    if (!res.pages.next) {
      setIsLastPage(true)
    }
  }

  useEffect(() => {
    if (!projectId || search === undefined) return
    fetchPlans()
  }, [paginationParams, search, projectId])

  useEffect(() => {
    if (!isShow || !tests) return
    setValue("name", testPlan.name)
    setValue("description", testPlan.description)
    setValue("started_at", moment(testPlan.started_at))
    setDateFrom(moment(testPlan.started_at))
    setValue("due_date", moment(testPlan.due_date))
    setDateTo(moment(testPlan.due_date))

    if (testPlan.parent) {
      setSelectedParent({ value: testPlan.parent.id, label: testPlan.parent.name })
      setValue("parent", testPlan.parent.id)
    }

    const ids = tests.case_ids.map((i) => String(i))
    setValue("test_cases", ids)
  }, [testPlan, isShow, tests])

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
          due_date: moment(data.due_date).format("YYYY-MM-DDThh:mm"),
          started_at: moment(data.started_at).format("YYYY-MM-DDThh:mm"),
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

  const handleSelectTestPlan = (value?: { label: string; value: number }) => {
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
  }
}
