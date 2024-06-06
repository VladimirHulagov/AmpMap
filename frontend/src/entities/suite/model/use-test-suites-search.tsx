import { useEffect, useState } from "react"
import { useParams } from "react-router"

import { useLazyGetTestSuitesTreeViewQuery } from "entities/suite/api"

import { TreeUtils, makeTestSuitesForTreeView } from "shared/libs"

export const useTestSuitesSearch = ({ isShow }: { isShow: boolean }) => {
  const { projectId } = useParams<ParamProjectId>()
  const [searchText, setSearchText] = useState("")
  const [data, setData] = useState<DataWithKey<Suite>[]>([])
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [getSuitesTree] = useLazyGetTestSuitesTreeViewQuery()

  const fetchData = async () => {
    setIsLoading(true)

    try {
      const res = await getSuitesTree({ project: projectId }).unwrap()
      const suitesWithKeys = makeTestSuitesForTreeView(res.results)
      setData(suitesWithKeys)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isShow || !projectId) return

    fetchData()
  }, [isShow, projectId])

  const onSearch = async (value: string) => {
    if (!projectId) return
    setSearchText(value)

    if (!value.trim().length) {
      setExpandedRowKeys([])
      fetchData()
      return
    }

    setIsLoading(true)

    try {
      const res = await getSuitesTree({ project: projectId, search: value }).unwrap()
      const suitesWithKeys = makeTestSuitesForTreeView(res.results)

      const [filteredRows, expandedRows] = TreeUtils.filterRows(suitesWithKeys, value, {
        isAllExpand: true,
        isShowChildren: true,
      })

      setExpandedRowKeys(expandedRows.map(Number))
      setData(filteredRows)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const onRowExpand = (expandedRows: number[], recordKey: number) => {
    if (expandedRows.includes(recordKey)) {
      setExpandedRowKeys(expandedRows.filter((key) => key !== recordKey))
    } else {
      setExpandedRowKeys([...expandedRows, recordKey])
    }
  }

  const onClearSearch = () => {
    setSearchText("")
    setData([])
    setExpandedRowKeys([])
  }

  return {
    searchText,
    data,
    isLoading,
    expandedRowKeys,
    onSearch,
    onClearSearch,
    onRowExpand,
  }
}
