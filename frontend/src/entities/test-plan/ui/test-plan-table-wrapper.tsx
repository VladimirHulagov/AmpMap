import { Collapse, Typography } from "antd"
import { useParams } from "react-router-dom"

import { useTestPlanTable } from "entities/test-plan/model"

import { TestPlanSearchAndTable } from "./test-plan-search-and-table"

interface TestPlanTableProps {
  collapse: boolean
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
  activePlan?: TestPlanTreeView
}

// TODO this component looks like same test suite table, need refactoring
export const TestPlanTableWrapper = ({ activePlan, collapse, setCollapse }: TestPlanTableProps) => {
  const {
    treeData,
    columns,
    showArchive,
    expandedRowKeys,
    paginationTable,
    isLoading,
    onSearch,
    onShowArchived,
    onRowExpand,
    handleRowClick,
    handleSorter,
  } = useTestPlanTable()
  const { testPlanId } = useParams<ParamTestPlanId>()

  const onCollapseChange = (key: string | string[]) => {
    if (!Array.isArray(key)) return
    setCollapse((prevState) => !prevState)
  }

  if (testPlanId && activePlan) {
    return (
      <Collapse
        style={{ backgroundColor: "#ffffff", marginBottom: 24 }}
        activeKey={!collapse ? "1" : "0"}
        onChange={onCollapseChange}
        bordered={false}
      >
        <Collapse.Panel header={<Typography.Text>Child plans</Typography.Text>} key="1">
          <TestPlanSearchAndTable
            isLoading={isLoading}
            handleSorter={handleSorter}
            padding={0}
            treeTestPlans={treeData}
            columns={columns}
            expandedRowKeys={expandedRowKeys}
            onRowExpand={onRowExpand}
            onSearch={onSearch}
            showArchive={showArchive}
            onShowArchived={onShowArchived}
            onHandleRowClick={handleRowClick}
            paginationTable={paginationTable}
          />
        </Collapse.Panel>
      </Collapse>
    )
  }

  return (
    <TestPlanSearchAndTable
      isLoading={isLoading}
      handleSorter={handleSorter}
      treeTestPlans={treeData}
      columns={columns}
      expandedRowKeys={expandedRowKeys}
      onRowExpand={onRowExpand}
      onSearch={onSearch}
      showArchive={showArchive}
      onShowArchived={onShowArchived}
      onHandleRowClick={handleRowClick}
      paginationTable={paginationTable}
    />
  )
}
