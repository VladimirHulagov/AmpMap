import { RowSelectMethod } from "antd/es/table/interface"
import { Key, useEffect } from "react"

interface Props {
  tableSettings: TestTableParams | TestCaseTableParams
  data: PaginationResponse<{ id: Id }[]> | undefined
  dispatch: (settings: Partial<TestTableParams | TestCaseTableParams>) => void
}

export const useRowSelection = ({ tableSettings, data, dispatch }: Props) => {
  const handleSelectRows = (
    selectedRowKeys: Key[],
    selectedRows: unknown[],
    info: {
      type: RowSelectMethod
    }
  ) => {
    dispatch({
      selectedRows: selectedRowKeys as number[],
      hasBulk: !!selectedRowKeys.length,
    })

    if (info.type === "all") {
      const newIsAllSelected = !tableSettings.isAllSelectedTableBulk
      dispatch({ excludedRows: [], isAllSelectedTableBulk: newIsAllSelected })
      if (!newIsAllSelected) {
        dispatch({
          selectedRows: [],
          hasBulk: false,
        })
      } else {
        dispatch({ selectedRows: data?.results.map((test) => test.id) ?? [] })
      }
    } else {
      if (tableSettings.isAllSelectedTableBulk) {
        //Exclude
        const notThisPageExcluded = tableSettings.excludedRows.filter(
          (id) => !data?.results.find((test) => test.id === id)
        )
        const currentPageExcluded =
          data?.results
            .filter((test) => !selectedRowKeys.includes(test.id))
            .map((test) => test.id) ?? []

        dispatch({ excludedRows: [...notThisPageExcluded, ...currentPageExcluded], hasBulk: true })
      }
    }
  }

  useEffect(() => {
    if (tableSettings.isAllSelectedTableBulk && data?.results) {
      const newSelectedRows = data.results
        .map((test) => test.id)
        .filter((id) => !tableSettings.excludedRows.includes(id))
      dispatch({
        selectedRows: newSelectedRows,
      })
    }

    dispatch({ count: data?.count ?? 0 })
  }, [data])

  return { handleSelectRows }
}
