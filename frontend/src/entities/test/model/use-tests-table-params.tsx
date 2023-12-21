import { useAppDispatch, useAppSelector } from "app/hooks"

import {
  incrementNonce,
  selectTableParams,
  setInitialTableParams,
  setTableParams as setTableParamsModel,
} from "entities/test/model"

import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"

export function useTestsTableParams() {
  const tableParams = useAppSelector(selectTableParams)
  const dispatch = useAppDispatch()

  const setTableParams = (params: TestTableParams) => {
    const sortTesty =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      params.sorter && !tableParams.sorter ? antdSorterToTestySort(params.sorter, "tests") : ""

    dispatch(
      setTableParamsModel({
        ...tableParams,
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
