import { Key } from "antd/lib/table/interface"
import { DataNode } from "antd/lib/tree"
import { useEffect, useMemo, useState } from "react"

import { addKeyToData } from "shared/libs/add-key-to-data"

import { SelectSuiteModalProps } from "./select-suite-modal"

export const useSelectSuiteModal = ({
  opened,
  selectedSuiteId,
  onSubmit,
  treeSuites,
}: SelectSuiteModalProps) => {
  const [selectedSuite, setSelectedSuite] = useState<number>(selectedSuiteId)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([selectedSuiteId])
  const [searchValue, setSearchValue] = useState("")
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  const handleSubmit = () => {
    onSubmit(selectedSuite)
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
  }

  const hadleChangeSuite = (value: Key[]) => {
    if (!value.length) {
      return
    }
    setSelectedSuite(value[0] as number)
  }

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys)
    setAutoExpandParent(false)
  }

  const treeData = useMemo(() => {
    const buildBranch = (data: Suite[]): DataNode[] =>
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

            return { title, key: item.id, children }
          }

          if (shouldSkip) {
            return null
          }

          return {
            title,
            key: item.id,
          }
        })
        .filter((x) => !!x) as DataNode[]

    return buildBranch(addKeyToData(treeSuites))
  }, [searchValue])

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
