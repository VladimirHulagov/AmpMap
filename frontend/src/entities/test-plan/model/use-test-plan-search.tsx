import { useState } from "react"

import { TreeUtils } from "shared/libs"

export const useTestPlanSearch = () => {
  const [searchText, setSearchText] = useState("")
  const [filterTable, setFilterTable] = useState<ISuite[]>([])
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

  const onSearch = (treeSuites: ISuite[], value: string) => {
    setSearchText(value)

    if (!value.trim()) {
      setFilterTable(treeSuites)
      setExpandedRowKeys([])
      return
    }

    const [filteredRows, expandedRows] = TreeUtils.filterRows<ISuite>(treeSuites, value, {
      isAllExpand: true,
      isShowChildren: true,
    })

    setExpandedRowKeys(expandedRows as string[])
    setFilterTable(filteredRows)
  }

  const onRowExpand = (expandedRows: string[], recordKey: string) => {
    if (expandedRows.includes(recordKey)) {
      setExpandedRowKeys(expandedRows.filter((key) => key !== recordKey))
    } else {
      setExpandedRowKeys([...expandedRows, recordKey])
    }
  }

  const onClearSearch = () => {
    setSearchText("")
    setFilterTable([])
    setExpandedRowKeys([])
  }

  return {
    searchText,
    filterTable,
    expandedRowKeys,
    onSearch,
    onRowExpand,
    onClearSearch,
  }
}
