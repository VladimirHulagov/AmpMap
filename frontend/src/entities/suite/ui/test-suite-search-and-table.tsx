import { Table } from "antd"
import { TablePaginationConfig } from "antd/es/table"
import Search from "antd/lib/input/Search"
import { Content } from "antd/lib/layout/layout"
import { ColumnsType } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import { CreateSuite } from "features/suite"

import { TreeUtils } from "shared/libs"

interface TestSuiteSearchAndTableProps {
  padding?: number
  treeSuites: ISuite[]
  expandedRowKeys: number[]
  onSearch: (treeSuites: ISuite[], searchText: string) => void
  onSearchFieldClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
  columns: ColumnsType<ISuite>
  onRowExpand: (expandedRows: number[], recordKey: number) => void
  onHandleRowClick: (testPlan: ISuite) => void
  paginationTable: TablePaginationConfig
  handleSorter: (sorter: SorterResult<ISuite> | SorterResult<ISuite>[]) => void
}

export const TestSuiteSearchAndTable = ({
  padding = 24,
  treeSuites,
  expandedRowKeys,
  onSearch,
  onSearchFieldClick,
  columns,
  onRowExpand,
  onHandleRowClick,
  paginationTable,
  handleSorter,
}: TestSuiteSearchAndTableProps) => {
  return (
    <>
      <Content>
        <div className="site-layout-background" style={{ padding, minHeight: 360 }}>
          <div style={{ display: "flex", marginBottom: 24 }}>
            <Search
              placeholder="Search"
              onChange={(e) => onSearch(treeSuites, e.target.value)}
              onClick={onSearchFieldClick}
            />
            <CreateSuite type="main" />
          </div>
          <Table
            style={{ cursor: "pointer" }}
            dataSource={TreeUtils.deleteChildren<ISuite>(JSON.parse(JSON.stringify(treeSuites)))}
            columns={columns}
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
    </>
  )
}
