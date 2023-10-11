import { LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Button, Space, Table } from "antd"
import { ColumnsType } from "antd/es/table"
import { Link } from "react-router-dom"

import { useTestCasesTable } from "entities/test-case/model"

import { ContainerLoader, HighLighterTesty } from "shared/ui"

export const TestCasesTable = () => {
  const {
    isLoading,
    testCases,
    testCaseId,
    filteredInfo,
    searchText,
    paginationTable,
    getColumnSearch,
    handleChange,
    clearAll,
    handleRowClick,
    hideTestCaseDetail,
    showTestCaseDetail,
  } = useTestCasesTable()

  const columns: ColumnsType<ITestCase> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: "70px",
      sorter: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filteredValue: filteredInfo.name || null,
      ...getColumnSearch("name"),
      onFilter: (value, record) => record.name.toLowerCase().includes(String(value).toLowerCase()),
      render: (text, record) => (
        <Link to={`/projects/${record.project}/suites/${record.suite}?test_case=${record.id}`}>
          <HighLighterTesty searchWords={searchText} textToHighlight={text} />
        </Link>
      ),
    },
    {
      key: "action",
      width: "50px",
      align: "right",
      render: (_, record) => {
        return testCaseId === record.id ? (
          <Button size={"middle"} type={"text"} onClick={hideTestCaseDetail}>
            <LeftOutlined />
          </Button>
        ) : (
          <Button size={"middle"} type={"text"} onClick={() => showTestCaseDetail(record.id)}>
            <RightOutlined />
          </Button>
        )
      },
    },
  ]

  if (isLoading || !testCases) return <ContainerLoader />

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll}>
          Clear filters and sorters
        </Button>
      </Space>
      <Table
        rowClassName={(record) => (record.id === testCaseId ? "active" : "")}
        style={{ marginTop: 12, cursor: "pointer" }}
        columns={columns}
        dataSource={testCases.results}
        size="small"
        pagination={paginationTable}
        onChange={handleChange}
        onRow={(record) => {
          return {
            onClick: () => handleRowClick(record),
          }
        }}
      />
    </>
  )
}
