import { Spin } from "antd"
import { Key } from "antd/lib/table/interface"
import { DataNode, EventDataNode } from "antd/lib/tree"
import { useEffect, useMemo, useState } from "react"

import { useLazyGetTestSuitesTreeViewQuery } from "entities/suite/api"

import { useOnViewLoad } from "shared/hooks/use-on-view-load"
import { addKeyToData } from "shared/libs/add-key-to-data"

import { SelectSuiteModalProps } from "./select-suite-modal"

type DataNodeWithName = DataNode & { name?: string }

export const useSelectSuiteModal = ({
  opened,
  selectedSuiteId,
  onSubmit,
}: SelectSuiteModalProps) => {
  const [getData] = useLazyGetTestSuitesTreeViewQuery()
  const { data, reset, fetchInitData, handleSearchChange, isLastPage, isLoading, iref } =
    useOnViewLoad({ getData, pageSize: 50 })

  const [selectedSuite, setSelectedSuite] = useState<number>(selectedSuiteId)
  const [selectedSuiteName, setSelectedSuiteName] = useState<string>("")
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([selectedSuiteId])
  const [searchValue, setSearchValue] = useState("")
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  const handleSubmit = () => {
    onSubmit(selectedSuite, selectedSuiteName)
  }

  useEffect(() => {
    if (opened) {
      setSelectedSuite(selectedSuiteId)
      setExpandedKeys([selectedSuiteId])
      setSearchValue("")
    }
  }, [opened, selectedSuiteId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setSearchValue(value)
    setAutoExpandParent(true)

    handleSearchChange(value)
  }

  useEffect(() => {
    if (!opened) {
      reset()
    } else {
      fetchInitData()
    }
  }, [opened])

  const hadleChangeSuite = (
    value: Key[],
    info: {
      node: EventDataNode<DataNodeWithName>
    }
  ) => {
    if (!value.length) {
      return
    }

    setSelectedSuite(value[0] as number)
    if (info.node.name) {
      setSelectedSuiteName(info.node.name)
    }
  }

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys)
    setAutoExpandParent(false)
  }

  const treeData = useMemo(() => {
    const buildBranch = (data: SuiteTree[]): DataNodeWithName[] =>
      data
        .map((item) => {
          const isSelected = selectedSuiteId === item.id
          const strTitle = item.title
          const index = strTitle.indexOf(searchValue)
          const beforeStr = strTitle.substring(0, index)
          const afterStr = strTitle.slice(index + searchValue.length)
          const shouldSkip = searchValue !== "" && index === -1 && !isSelected

          const title =
            index > -1 ? (
              <span>
                {beforeStr}
                <span className="site-tree-search-value">{searchValue}</span>
                {afterStr}
              </span>
            ) : (
              <span>{strTitle}</span>
            )

          if (item.children?.length) {
            const children = buildBranch(item.children)
            if (children.length === 0 && shouldSkip) {
              return null
            }

            return { title, key: item.id, children, name: strTitle }
          }

          if (shouldSkip) {
            return null
          }

          return {
            title,
            key: item.id,
            name: strTitle,
          }
        })
        .filter((x) => !!x) as DataNodeWithName[]

    const result = buildBranch(addKeyToData(data))

    if (isLoading) {
      result.push({
        title: (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              userSelect: "none",
            }}
          >
            <Spin />
          </div>
        ),
        key: -999,
      })
    }
    if (!isLastPage && !isLoading && data.length) {
      result.push({
        title: <div ref={iref}></div>,
        key: -1000,
      })
    }
    return result
  }, [data, isLastPage, isLoading])

  return {
    handleSubmit,
    handleChange,
    setSelectedSuite,
    treeData,
    expandedKeys,
    onExpand,
    autoExpandParent,
    selectedKeys: [selectedSuite],
    hadleChangeSuite,
  }
}
