import { Table } from "antd"
import { TablePaginationConfig } from "antd/es/table"
import Search from "antd/lib/input/Search"
import { Content } from "antd/lib/layout/layout"
import { ColumnsType } from "antd/lib/table"
import { SorterResult } from "antd/lib/table/interface"
import { CreateSuite } from "features/suite"

import { TreeUtils } from "shared/libs"

interface TestSuiteSearchAndTableProps {
  isLoading: boolean
  padding?: number
  treeSuites: SuiteTree[]
  expandedRowKeys: string[]
  onSearch: (searchText: string) => void
  onSearchFieldClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
  columns: ColumnsType<SuiteTree>
  onRowExpand: (expandedRows: string[], recordKey: string) => void
  onHandleRowClick: (testPlan: SuiteTree) => void
  paginationTable: TablePaginationConfig
  handleSorter: (sorter: SorterResult<SuiteTree> | SorterResult<SuiteTree>[]) => void
  onListChange: () => void
}

export const TestSuiteSearchAndTable = ({
  isLoading,
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
  onListChange,
}: TestSuiteSearchAndTableProps) => {
  return (
    <>
      <Content>
        <div className="site-layout-background" style={{ padding, minHeight: 360 }}>
          <div style={{ display: "flex", marginBottom: 24 }}>
            <Search
              placeholder="Search"
              onChange={(e) => onSearch(e.target.value)}
              onClick={onSearchFieldClick}
            />
            <CreateSuite onSubmit={onListChange} />
          </div>
          <Table
            rowKey="id"
            style={{ cursor: "pointer" }}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            dataSource={TreeUtils.deleteChildren<SuiteTree>(JSON.parse(JSON.stringify(treeSuites)))}
            columns={columns}
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
    </>
  )
}
