import { Table } from "antd"
import { TablePaginationConfig } from "antd/es/table"
import { FilterValue, SorterResult } from "antd/es/table/interface"
import Search from "antd/lib/input/Search"
import { Content } from "antd/lib/layout/layout"
import { ColumnsType } from "antd/lib/table"
import { CreateSuite } from "features/suite"

import { TreeUtils } from "shared/libs"

interface TestSuiteSearchAndTableProps {
  isLoading: boolean
  padding?: number
  treeSuites: SuiteTree[]
  expandedRowKeys: string[]
  onSearch: (searchText: string) => void
  searchText: string
  onSearchFieldClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
  columns: ColumnsType<SuiteTree>
  onRowExpand: (expandedRows: string[], recordKey: string) => void
  onHandleRowClick: (testSuite: SuiteTree, e: React.MouseEvent<unknown, MouseEvent>) => void
  paginationTable: TablePaginationConfig
  handleChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<SuiteTree> | SorterResult<SuiteTree>[]
  ) => void
  onListChange: () => void
}

export const TestSuiteSearchAndTable = ({
  isLoading,
  padding = 24,
  treeSuites,
  expandedRowKeys,
  searchText,
  onSearch,
  onSearchFieldClick,
  columns,
  onRowExpand,
  onHandleRowClick,
  paginationTable,
  handleChange,
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
              value={searchText}
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
            onChange={handleChange}
            onRow={(record) => {
              return {
                onClick: (e) => onHandleRowClick(record, e),
              }
            }}
            loading={isLoading}
          />
        </div>
      </Content>
    </>
  )
}
