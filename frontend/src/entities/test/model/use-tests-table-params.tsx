import { useAppDispatch, useAppSelector } from "app/hooks"

import {
  incrementNonce,
  selectTableParams,
  setInitialTableParams,
  setTableParams as setTableParamsModel,
} from "entities/test/model"

import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"

interface Props {
  onFiltersChange?: (
    prev: TestTableFilters | undefined,
    updated: TestTableFilters | undefined
  ) => void
}

export function useTestsTableParams({ onFiltersChange }: Props = {}) {
  const tableParams = useAppSelector(selectTableParams)
  const dispatch = useAppDispatch()

  const setTableParams = (params: TestTableParams) => {
    const sortTesty =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      params.sorter && !tableParams.sorter ? antdSorterToTestySort(params.sorter, "tests") : ""

    const isPlanChanged =
      Number.isInteger(tableParams.testPlanId) &&
      Number.isInteger(params.testPlanId) &&
      tableParams.testPlanId !== params.testPlanId

    const prevValue = isPlanChanged ? {} : params

    const valueToSet = {
      ...prevValue,
      ...params,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sorter: params.sorter ? sortTesty : tableParams.sorter,
    }

    if (JSON.stringify(tableParams) === JSON.stringify(valueToSet)) {
      return
    }

    if (
      onFiltersChange &&
      JSON.stringify(tableParams.filters ?? {}) !== JSON.stringify(valueToSet.filters ?? {})
    ) {
      onFiltersChange(tableParams.filters, params.filters)
    }

    dispatch(
      setTableParamsModel({
        ...prevValue,
        ...params,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        sorter: params.sorter ? sortTesty : tableParams.sorter,
      })
    )
  }

  const reset = () => {
    dispatch(setInitialTableParams())
  }

  const trigger = () => {
    dispatch(incrementNonce())
  }

  return {
    tableParams,
    setTableParams,
    reset,
    trigger,
  }
}
