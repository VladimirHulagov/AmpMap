import { notification } from "antd"
import dayjs, { Dayjs } from "dayjs"
import React, { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useGetParametersQuery } from "entities/parameter/api"

import { useTestCasesSearch } from "entities/test-case/model"

import { useCreateTestPlanMutation, useLazyGetTestPlansQuery } from "entities/test-plan/api"
import { getTestCaseChangeResult } from "entities/test-plan/lib"

import { useDatepicker, useErrors } from "shared/hooks"
import { makeParametersForTreeView, showModalCloseConfirm } from "shared/libs"
import { AlertSuccessChange } from "shared/ui/alert-success-change"

import { useSearchField } from "widgets/search-field"

interface ErrorData {
  name?: string
  description?: string
  parent?: string
  parameters?: string
  test_cases?: string
  started_at?: string
  due_date?: string
}

type IForm = Modify<
  TestPlanCreate,
  {
    test_cases: string[]
    started_at: Dayjs
    due_date: Dayjs
  }
>

interface UseTestPlanCreateModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testPlan?: TestPlanTreeView
}

export const useTestPlanCreateModal = ({
  isShow,
  setIsShow,
  testPlan,
}: UseTestPlanCreateModalProps) => {
  const { projectId } = useParams<ParamProjectId & ParamTestPlanId>()
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty, errors: formErrors },
    watch,
  } = useForm<IForm>({
    defaultValues: {
      name: "",
      description: "",
      test_cases: [],
      parameters: [],
      parent: undefined,
      started_at: dayjs(),
      due_date: dayjs().add(1, "day"),
    },
  })
  const testCasesWatch = watch("test_cases")

  const [parametersTreeView, setParametersTreeView] = useState<IParameterTreeView[]>([])

  const {
    searchText,
    treeData,
    expandedRowKeys,
    isLoading: isLoadingTreeData,
    onSearch,
    onRowExpand,
    onClearSearch,
  } = useTestCasesSearch({ isShow })
  const [createTestPlan, { isLoading: isLoadingCreateTestPlan }] = useCreateTestPlanMutation()

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

  const { data: parameters } = useGetParametersQuery(Number(projectId), {
    skip: !projectId,
  })
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const { setDateFrom, setDateTo, disabledDateFrom, disabledDateTo } = useDatepicker()

  const [selectedParent, setSelectedParent] = useState<{ label: string; value: number } | null>(
    null
  )

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

  const handleSelectTestPlan = (value?: { label: string; value: number }) => {
    setErrors({ parent: "" })
    if (Number(value?.value) === Number(testPlan?.id)) {
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
  }
}
