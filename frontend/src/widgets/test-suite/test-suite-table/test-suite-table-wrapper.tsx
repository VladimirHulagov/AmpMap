import { Collapse, Typography } from "antd"

import { TestSuiteSearchAndTable } from "./test-suite-search-and-table"
import { useTestSuiteTable } from "./use-test-suite-table"

interface TestSuiteTableProps {
  collapse: boolean
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
  activeSuite?: Suite
}

export const TestSuiteTableWrapper = ({
  activeSuite,
  collapse,
  setCollapse,
}: TestSuiteTableProps) => {
  const {
    treeSuites,
    expandedRowKeys,
    columns,
    testSuiteId,
    paginationTable,
    isLoading,
    searchText,
    onCollapseChange,
    onSearch,
    onSearchFieldClick,
    onRowExpand,
    handleRowClick,
    handleChange,
    invalidateList,
  } = useTestSuiteTable({ setCollapse, activeSuite })

  if (testSuiteId && activeSuite) {
    return (
      <Collapse
        style={{ backgroundColor: "#ffffff", marginBottom: 24 }}
        activeKey={!collapse ? "1" : "0"}
        onChange={onCollapseChange}
        bordered={false}
      >
        <Collapse.Panel header={<Typography.Text>Child suites</Typography.Text>} key="1">
          <TestSuiteSearchAndTable
            isLoading={isLoading}
            padding={0}
            treeSuites={treeSuites}
            columns={columns}
            expandedRowKeys={expandedRowKeys}
            onRowExpand={onRowExpand}
            onSearch={onSearch}
            searchText={searchText}
            onSearchFieldClick={onSearchFieldClick}
            onHandleRowClick={handleRowClick}
            paginationTable={paginationTable}
            handleChange={handleChange}
            onListChange={invalidateList}
          />
        </Collapse.Panel>
      </Collapse>
    )
  }

  return (
    <TestSuiteSearchAndTable
      isLoading={isLoading}
      treeSuites={treeSuites}
      columns={columns}
      expandedRowKeys={expandedRowKeys}
      onRowExpand={onRowExpand}
      onSearch={onSearch}
      searchText={searchText}
      onSearchFieldClick={onSearchFieldClick}
      onHandleRowClick={handleRowClick}
      paginationTable={paginationTable}
      handleChange={handleChange}
      onListChange={invalidateList}
    />
  )
}
