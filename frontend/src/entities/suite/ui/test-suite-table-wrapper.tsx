import { Collapse, Typography } from "antd"

import { useTestSuiteTable } from "entities/suite/model"

import { ContainerLoader } from "shared/ui"

import { TestSuiteSearchAndTable } from "./test-suite-search-and-table"

interface TestSuiteTableProps {
  collapse: boolean
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
  activeSuite?: ISuite
}

export const TestSuiteTableWrapper = ({
  activeSuite,
  collapse,
  setCollapse,
}: TestSuiteTableProps) => {
  const {
    isLoading,
    treeSuites,
    treeSuitesChild,
    expandedRowKeys,
    columns,
    testSuiteId,
    paginationTable,
    onCollapseChange,
    onSearch,
    onSearchFieldClick,
    onRowExpand,
    handleRowClick,
    handleSorter,
  } = useTestSuiteTable({ setCollapse, activeSuite })

  if (isLoading) return <ContainerLoader />

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
            padding={0}
            treeSuites={treeSuitesChild?.results || []}
            columns={columns}
            expandedRowKeys={expandedRowKeys}
            onRowExpand={onRowExpand}
            onSearch={onSearch}
            onSearchFieldClick={onSearchFieldClick}
            onHandleRowClick={handleRowClick}
            paginationTable={paginationTable}
            handleSorter={handleSorter}
          />
        </Collapse.Panel>
      </Collapse>
    )
  }

  return (
    <TestSuiteSearchAndTable
      treeSuites={treeSuites?.results || []}
      columns={columns}
      expandedRowKeys={expandedRowKeys}
      onRowExpand={onRowExpand}
      onSearch={onSearch}
      onSearchFieldClick={onSearchFieldClick}
      onHandleRowClick={handleRowClick}
      paginationTable={paginationTable}
      handleSorter={handleSorter}
    />
  )
}
