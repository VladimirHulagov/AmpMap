import { Button, Space, Tree, TreeProps } from "antd"
import { Key, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"

import { suitesFilterFormat } from "entities/suite/lib/suites-filter-format"

import { useTestsTableParams } from "entities/test/model"

import { useGetTestPlanSuitesQuery } from "entities/test-plan/api"

const INITIAL_PAGINATION = { current: 1 }

interface SuiteFiltersDrowdownProps {
  setSelectedKeys: React.Dispatch<React.SetStateAction<Key[]>>
  selectedKeys: Key[]
  close: () => void
}

export const SuiteFiltersDrowdown = ({
  setSelectedKeys,
  selectedKeys,
  close,
}: SuiteFiltersDrowdownProps) => {
  const { testPlanId } = useParams<ParamTestPlanId>()
  const { data: suites } = useGetTestPlanSuitesQuery(String(testPlanId), { skip: !testPlanId })
  const { tableParams, setTableParams } = useTestsTableParams()

  const handleReset = () => {
    setTableParams({
      filters: {
        suite: [],
      },
      pagination: INITIAL_PAGINATION,
    })
    setSelectedKeys([])
  }

  const handleSelectAll = () => {
    setSelectedKeys(suitesTree.keys)
    setTableParams({
      filters: {
        suite: suitesTree.keys,
      },
      pagination: INITIAL_PAGINATION,
    })
  }

  const handleCheck: TreeProps["onCheck"] = (checkedKeysValue) => {
    const checked = Array.isArray(checkedKeysValue) ? checkedKeysValue : checkedKeysValue.checked
    setSelectedKeys(checked)
    setTableParams({
      filters: {
        suite: checked as string[],
      },
      pagination: INITIAL_PAGINATION,
    })
  }

  const suitesTree = useMemo(() => {
    if (!suites) return { data: [], keys: [] }
    const [data, keys] = suitesFilterFormat(suites)
    return {
      data,
      keys,
    }
  }, [suites])

  useEffect(() => {
    if (!tableParams.filters?.suite?.length) return
    setSelectedKeys(tableParams.filters.suite)
  }, [tableParams])

  if (!suites) return null

  return (
    <div id="suite-filters-dropdown" style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <Space style={{ marginBottom: 8 }}>
        <Button size="small" onClick={handleSelectAll} style={{ padding: "0 20px" }}>
          Select All
        </Button>
        <Button onClick={handleReset} size="small" style={{ padding: "0 20px" }}>
          Reset
        </Button>
        <Button type="link" size="small" onClick={() => close()}>
          Close
        </Button>
      </Space>
      <Tree
        defaultCheckedKeys={selectedKeys}
        height={200}
        virtual={false}
        showIcon={false}
        selectable={false}
        checkable
        checkStrictly
        treeData={suitesTree.data}
        checkedKeys={selectedKeys}
        onCheck={handleCheck}
      />
      <span style={{ opacity: 0.7, marginTop: 4 }}>Selected: {selectedKeys.length} suites</span>
    </div>
  )
}
