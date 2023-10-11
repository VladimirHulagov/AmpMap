import { Collapse, Typography } from "antd"
import { useParams } from "react-router-dom"

import { useTestPlanTable } from "entities/test-plan/model"

import { ContainerLoader } from "shared/ui"

import { TestPlanSearchAndTable } from "./test-plan-search-and-table"

interface TestPlanTableProps {
  collapse: boolean
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
  activePlan?: ITestPlanTreeView
}

// TODO this component looks like same test suite table, need refactoring
export const TestPlanTableWrapper = ({ activePlan, collapse, setCollapse }: TestPlanTableProps) => {
  const {
    isLoading,
    treeTestPlans,
    columns,
    showArchive,
    expandedRowKeys,
    paginationTable,
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

  if (isLoading || !treeTestPlans) return <ContainerLoader />

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
            handleSorter={handleSorter}
            padding={0}
            treeTestPlans={treeTestPlans.results}
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
      handleSorter={handleSorter}
      treeTestPlans={treeTestPlans.results}
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
