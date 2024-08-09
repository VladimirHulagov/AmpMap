import { Button, Checkbox, Col, Row, Space, Table, Typography } from "antd"
import { MoveTests } from "features/test-plan"
import { AssignTestsBulk } from "features/test-result"
import { TestPlanLabels } from "widgets"

import { SettingsColumnVisibility } from "shared/ui/settings-column-visibility/settings-column-visibility"

import styles from "./styles.module.css"
import { useTestsTable } from "./use-tests-table"

interface Props {
  testPlanId: Id
}

export const TestsTable = ({ testPlanId }: Props) => {
  const {
    data,
    isLoading,
    isShowArchive,
    columns,
    visibleColumns,
    filteredColumns,
    activeTestId,
    paginationTable,
    handleChangeVisibleColumns,
    handleShowArchived,
    handleClearAll,
    handleTableChange,
    handleRowClick,
    isRefreshingTable,
    hasSelection,
    handleMoveSubmit,
    selectedRows,
    handleSelectRows,
    handleBulkAssignSubmit,
  } = useTestsTable({ testPlanId })

  return (
    <>
      <Row>
        <Col flex="1 1 200px">
          <TestPlanLabels testPlanId={String(testPlanId)} />
        </Col>
        <Col flex="0 1 190px" className={styles.colRight}>
          <Space className={styles.btnShowArchive}>
            <Checkbox checked={isShowArchive} onChange={handleShowArchived}>
              Show Archived
            </Checkbox>
          </Space>
          <Space className={styles.btnsRow}>
            <Button id="clear-filters-and-sorters" onClick={handleClearAll}>
              Clear filters and sorters
            </Button>
            <SettingsColumnVisibility
              id="tests-table-setting-columns-btn"
              columns={columns}
              visibilityColumns={visibleColumns}
              onChange={handleChangeVisibleColumns}
            />
          </Space>
        </Col>
      </Row>
      {!isRefreshingTable && (
        <Table
          style={{ cursor: "pointer" }}
          title={() => (
            <div className={styles.titleRow}>
              <Typography.Paragraph style={{ fontSize: 22 }}>Tests</Typography.Paragraph>
              {hasSelection && <MoveTests onSubmit={handleMoveSubmit} />}
              {hasSelection && <AssignTestsBulk onSubmit={handleBulkAssignSubmit} />}
            </div>
          )}
          rowClassName={(record) => (record.id === activeTestId ? "active" : "")}
          columns={filteredColumns}
          pagination={paginationTable}
          dataSource={data}
          loading={isLoading}
          size="small"
          onChange={handleTableChange}
          onRow={(record) => {
            return {
              onClick: () => handleRowClick(record),
            }
          }}
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: handleSelectRows,
            preserveSelectedRowKeys: true,
          }}
          rowKey="id"
        />
      )}
    </>
  )
}
