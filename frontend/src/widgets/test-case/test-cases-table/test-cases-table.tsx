import { Button, Checkbox, Space, Table } from "antd"

import { TestCaseDetail } from "widgets/test-case"

import { useTestCasesTable } from "./use-test-cases-table"

export const TestCasesTable = () => {
  const {
    isShowArchive,
    columns,
    isLoading,
    testCases,
    selectedTestCase,
    paginationTable,
    handleChange,
    clearAll,
    handleRowClick,
    hideTestCaseDetail,
    handleShowArchived,
    isRefreshingTable,
  } = useTestCasesTable()

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <div style={{ display: "flex", marginBottom: 8, float: "right" }}>
        <Checkbox checked={isShowArchive} onChange={handleShowArchived}>
          Show Archived
        </Checkbox>
      </div>
      {!isRefreshingTable && (
        <Table
          loading={isLoading}
          rowKey="id"
          rowClassName={(record) => (record.id === selectedTestCase?.id ? "active" : "")}
          style={{ marginTop: 12, cursor: "pointer" }}
          columns={columns}
          dataSource={testCases}
          size="small"
          pagination={paginationTable}
          onChange={handleChange}
          onRow={(record) => {
            return {
              onClick: (e) => handleRowClick(record, e),
            }
          }}
        />
      )}
      <TestCaseDetail testCase={selectedTestCase} onClose={hideTestCaseDetail} />
    </>
  )
}
