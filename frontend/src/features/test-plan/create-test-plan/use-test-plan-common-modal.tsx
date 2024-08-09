import { Dayjs } from "dayjs"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { useTestCaseFormLabels } from "entities/label/model"

import { useTestCasesSearch } from "entities/test-case/model"

import { useLazyGetTestPlansQuery } from "entities/test-plan/api"

import { useDatepicker, useErrors } from "shared/hooks"

import { useSearchField } from "widgets/search-field"

interface Params {
  isShow: boolean
}

export interface ErrorData {
  name?: string
  description?: string
  parent?: string
  test_cases?: string
  started_at?: string
  due_date?: string
  parameters?: string
}

export type ModalForm<T> = Modify<
  T,
  {
    test_cases: string[]
    started_at: Dayjs
    due_date: Dayjs
  }
>

export const useTestPlanCommonModal = ({ isShow }: Params) => {
  const { projectId } = useParams<ParamProjectId & ParamTestPlanId>()
  const [errors, setErrors] = useState<ErrorData | null>(null)

  const [getPlans] = useLazyGetTestPlansQuery()
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoadingTestPlans, setIsLoadingTestPlans] = useState(false)
  const [dataTestPlans, setDataTestPlans] = useState<TestPlan[]>([])

  const {
    searchText,
    treeData,
    expandedRowKeys,
    isLoading: isLoadingTreeData,
    onSearch,
    onRowExpand,
    onClearSearch,
  } = useTestCasesSearch({ isShow })

  const [selectedLables, setSelectedLabels] = useState<number[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const setLables = (_: string, values: any, data: any) => {
    const v = values as { name: string; id?: number }[]
    setSelectedLabels(v.map((i) => i.id).filter((i) => i !== undefined) as number[])
  }

  const labelProps = useTestCaseFormLabels({
    setValue: setLables,
    testCase: null,
    isShow: true,
    isEditMode: false,
    defaultLabels: selectedLables,
  })

  const [lableCondition, setLableCondition] = useState<"and" | "or">("and")
  const [showArchived, setShowArchived] = useState(false)

  const handleToggleArchived = () => {
    setShowArchived(!showArchived)
  }

  const handleConditionClick = () => {
    setLableCondition(lableCondition === "and" ? "or" : "and")
  }

  useEffect(() => {
    onSearch(searchText, selectedLables, lableCondition, showArchived)
  }, [selectedLables, lableCondition, showArchived])

  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const [selectedParent, setSelectedParent] = useState<{ label: string; value: number } | null>(
    null
  )
  const { setDateFrom, setDateTo, disabledDateFrom, disabledDateTo } = useDatepicker()

  const {
    search,
    paginationParams,
    handleSearch: handleSearchField,
    handleLoadNextPageData,
  } = useSearchField()

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

  return {
    selectedLables,
    labelProps,
    lableCondition,
    handleConditionClick,
    showArchived,
    handleToggleArchived,
    projectId,
    errors,
    setErrors,
    getPlans,
    isLastPage,
    isLoadingTestPlans,
    dataTestPlans,
    setDataTestPlans,
    setIsLastPage,
    setIsLoadingTestPlans,
    onHandleError,
    selectedParent,
    setSelectedParent,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    search,
    paginationParams,
    handleSearch: handleSearchField,
    handleLoadNextPageData,
    searchText,
    treeData,
    expandedRowKeys,
    isLoading: isLoadingTreeData,
    onSearch,
    onRowExpand,
    onClearSearch,
    handleSearchTestPlan,
  }
}
