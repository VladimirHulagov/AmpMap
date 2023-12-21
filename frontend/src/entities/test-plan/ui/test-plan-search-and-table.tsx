import { Checkbox, Table } from "antd"
import Search from "antd/lib/input/Search"
import { Content } from "antd/lib/layout/layout"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import { CreateTestPlan } from "features/test-plan"

import { TreeUtils } from "shared/libs"

interface TestPlanSearchAndTableProps {
  isLoading: boolean
  padding?: number
  treeTestPlans: TestPlanTreeView[]
  expandedRowKeys: string[]
  onSearch: (searchText: string) => void
  columns: ColumnsType<TestPlanTreeView>
  onRowExpand: (expandedRows: string[], recordKey: string) => void
  onShowArchived: () => void
  showArchive: boolean
  onHandleRowClick: (testPlan: TestPlanTreeView) => void
  handleSorter: (sorter: SorterResult<TestPlanTreeView> | SorterResult<TestPlanTreeView>[]) => void
  paginationTable: TablePaginationConfig
}

// TODO this component looks like same test suite table, need refactoring
export const TestPlanSearchAndTable = ({
  isLoading,
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
          <Search placeholder="Search" onChange={(e) => onSearch(e.target.value)} />
          <CreateTestPlan />
        </div>
        <div style={{ display: "flex", marginBottom: 8, float: "right" }}>
          <Checkbox checked={showArchive} onChange={onShowArchived}>
            Show Archived
          </Checkbox>
        </div>
        <Table
          rowKey="id"
          style={{ cursor: "pointer" }}
          columns={columns}
          dataSource={TreeUtils.deleteChildren<TestPlanTreeView>(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            JSON.parse(JSON.stringify(treeTestPlans))
          )}
          pagination={paginationTable}
          expandable={{
            rowExpandable: (record) => record.children.length > 0,
            expandedRowKeys: expandedRowKeys.map((i) => Number(i)),
            onExpand: (_, record) => onRowExpand(expandedRowKeys, String(record.id)),
          }}
          onChange={(_, __, sorter) => handleSorter(sorter)}
          onRow={(record) => {
            return {
              onClick: () => onHandleRowClick(record),
            }
          }}
          loading={isLoading}
        />
      </div>
    </Content>
  )
}
