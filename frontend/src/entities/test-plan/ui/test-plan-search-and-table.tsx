import { Checkbox, Table } from "antd"
import Search from "antd/lib/input/Search"
import { Content } from "antd/lib/layout/layout"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import { CreateTestPlan } from "features/test-plan"

import { TreeUtils } from "shared/libs"

interface TestPlanSearchAndTableProps {
  padding?: number
  treeTestPlans: ITestPlanTreeView[]
  expandedRowKeys: number[]
  onSearch: (treeSuites: ITestPlanTreeView[], searchText: string) => void
  columns: ColumnsType<ITestPlanTreeView>
  onRowExpand: (expandedRows: number[], recordKey: number) => void
  onShowArchived: () => void
  showArchive: boolean
  onHandleRowClick: (testPlan: ITestPlanTreeView) => void
  handleSorter: (
    sorter: SorterResult<ITestPlanTreeView> | SorterResult<ITestPlanTreeView>[]
  ) => void
  paginationTable: TablePaginationConfig
}

// TODO this component looks like same test suite table, need refactoring
export const TestPlanSearchAndTable = ({
  padding = 24,
  treeTestPlans,
  expandedRowKeys,
  onSearch,
  columns,
  onRowExpand,
  onShowArchived,
  showArchive,
  onHandleRowClick,
  handleSorter,
  paginationTable,
}: TestPlanSearchAndTableProps) => {
  return (
    <Content>
      <div className="site-layout-background" style={{ padding, minHeight: 360 }}>
        <div style={{ display: "flex", marginBottom: 16, gap: 16 }}>
          <Search placeholder="Search" onChange={(e) => onSearch(treeTestPlans, e.target.value)} />
          <CreateTestPlan type="main" />
        </div>
        <div style={{ display: "flex", marginBottom: 8, float: "right" }}>
          <Checkbox checked={showArchive} onChange={onShowArchived}>
            Show Archived
          </Checkbox>
        </div>
        <Table
          style={{ cursor: "pointer" }}
          columns={columns}
          dataSource={TreeUtils.deleteChildren<ITestPlanTreeView>(
            JSON.parse(JSON.stringify(treeTestPlans))
          )}
          pagination={paginationTable}
          expandedRowKeys={expandedRowKeys}
          onExpand={(_, record) => onRowExpand(expandedRowKeys, record.id)}
          onChange={(_, __, sorter) => handleSorter(sorter)}
          onRow={(record) => {
            return {
              onClick: () => onHandleRowClick(record),
            }
          }}
        />
      </div>
    </Content>
  )
}
