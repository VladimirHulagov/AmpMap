import { TableOutlined } from "@ant-design/icons"
import { Button, Checkbox, Col, Popover, Row, Space, Table, Typography } from "antd"
import { TablePaginationConfig } from "antd/es/table"

import { ContainerLoader } from "shared/ui"

import { TestPlanLabels } from "widgets/test-plan"

import styles from "./styles.module.css"
import { useTestsTable } from "./use-tests-table"

export interface TestsTableProps {
  testPlanId: Id
}

export const TestsTable = ({ testPlanId }: TestsTableProps) => {
  const {
    isLoading,
    showArchive,
    columns,
    tests,
    test,
    tableParams,
    onChange,
    onShowArchived,
    clearAll,
    handleRowClick,
    columnNames,
    shownColumns,
    handleChangeShownColumns,
  } = useTestsTable(testPlanId)

  if (isLoading) return <ContainerLoader />

  return (
    <>
      <Row>
        <Col flex="1 1 200px">
          <TestPlanLabels testPlanId={String(testPlanId)} />
        </Col>
        <Col flex="0 1 190px" className={styles.colRight}>
          <Space className={styles.btnShowArchive}>
            <Checkbox checked={showArchive} onChange={onShowArchived}>
              Show Archived
            </Checkbox>
          </Space>
          <Space className={styles.btnsRow}>
            <Button id="clear-filters-and-sorters" onClick={clearAll}>
              Clear filters and sorters
            </Button>
            <Popover
              content={
                <Checkbox.Group
                  options={columnNames}
                  value={shownColumns}
                  onChange={handleChangeShownColumns}
                />
              }
              title="Shown columns"
              trigger="click"
              placement="bottomRight"
            >
              <Button id="columns-settings" icon={<TableOutlined />} />
            </Popover>
          </Space>
        </Col>
      </Row>

      <Table
        style={{ cursor: "pointer" }}
        title={() => <Typography.Paragraph style={{ fontSize: 22 }}>Tests</Typography.Paragraph>}
        rowClassName={(record) => (record.id === test?.id ? "active" : "")}
        columns={columns}
        pagination={tableParams.pagination as TablePaginationConfig}
        dataSource={
          showArchive ? tests?.results : tests?.results.filter((test) => !test.is_archive)
        }
        size="small"
        onChange={onChange}
        onRow={(record) => {
          return {
            onClick: () => handleRowClick(record),
          }
        }}
        rowKey="id"
      />
    </>
  )
}
