import { useEffect, useState } from "react"
import { useParams } from "react-router"

import { useLazySearchTestCasesQuery } from "entities/test-case/api"

import { TreeUtils, makeTestSuitesForTreeView } from "shared/libs"

export const useTestCasesSearch = ({ isShow }: { isShow: boolean }) => {
  const { projectId } = useParams<ParamProjectId>()
  const [searchText, setSearchText] = useState("")
  const [treeData, setTreeData] = useState<DataWithKey<Suite>[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTestCases] = useLazySearchTestCasesQuery()
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

  useEffect(() => {
    if (!isShow || !projectId) return
    const fetch = async () => {
      setIsLoading(true)
      const res = await searchTestCases({ project: projectId }).unwrap()
      const suitesWithKeys = makeTestSuitesForTreeView(res)
      setTreeData(suitesWithKeys as unknown as DataWithKey<Suite>[])
      setIsLoading(false)
    }

    fetch()
  }, [isShow, projectId])

  const onSearch = async (value: string) => {
    if (!projectId) return
    setSearchText(value)

    if (!value.trim().length) {
      setTreeData(treeData)
      setExpandedRowKeys([])
      return
    }

    setIsLoading(true)
    const res = await searchTestCases({
      project: projectId,
      search: value,
    }).unwrap()

    const suitesWithKeys = makeTestSuitesForTreeView(res)

    const [filteredRows, expandedRows] = TreeUtils.filterRows(
      suitesWithKeys as unknown as DataWithKey<Suite>[],
      value,
      {
        isAllExpand: true,
        isShowChildren: true,
      }
    )

    setExpandedRowKeys(expandedRows.map((key) => key.toString()))
    setTreeData(filteredRows)
    setIsLoading(false)
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
    setTreeData([])
    setExpandedRowKeys([])
  }

  return {
    searchText,
    treeData,
    expandedRowKeys,
    isLoading,
    onSearch,
    onRowExpand,
    onClearSearch,
  }
}
