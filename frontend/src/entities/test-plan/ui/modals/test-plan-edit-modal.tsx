import { Button, Col, DatePicker, Form, Input, Modal, Row, Tree } from "antd"
import Search from "antd/lib/input/Search"
import { Controller } from "react-hook-form"

import { useTestPlanEditModal } from "entities/test-plan/model"

import { TreeUtils } from "shared/libs"
import { AlertError, ContainerLoader, HighLighterTesty } from "shared/ui"

import { TestPlanParentField } from "../parent-field"
import styles from "./styles.module.css"

interface TestPlanEditModalProps {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  testPlan: ITestPlanTreeView
}

export const TestPlanEditModal = ({ isShow, setIsShow, testPlan }: TestPlanEditModalProps) => {
  const {
    errors,
    control,
    selectedParent,
    testSuites,
    searchText,
    filterTable,
    expandedRowKeys,
    isDirty,
    isLoadingFetch,
    isLoadingUpdate,
    handleClearParent,
    handleClose,
    handleRowExpand,
    handleSearch,
    handleSelectParent,
    handleSubmitForm,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
  } = useTestPlanEditModal({ isShow, setIsShow, testPlan })

  return (
    <Modal
      className="test-plan-edit-modal"
      open={isShow}
      title={`Edit Test Plan '${testPlan.name}'`}
      onCancel={handleClose}
      width="1100px"
      centered
      footer={[
        <Button id="close-test-plan-edit" key="back" onClick={handleClose}>
          Close
        </Button>,
        <Button
          id="update-test-plan-edit"
          key="submit"
          type="primary"
          onClick={handleSubmitForm}
          loading={isLoadingUpdate}
          disabled={!isDirty}
        >
          Update
        </Button>,
      ]}
    >
      {errors ? (
        <AlertError
          error={errors}
          skipFields={["name", "parent", "test_cases", "started_at", "due_date"]}
        />
      ) : null}
      {isLoadingFetch && <ContainerLoader />}
      {!isLoadingFetch && (
        <Form id="test-plan-edit-form" layout="vertical" onFinish={handleSubmitForm}>
          <Row gutter={[32, 32]}>
            <Col span={12}>
              <Form.Item
                label="Name"
                validateStatus={errors?.name ? "error" : ""}
                help={errors?.name ? errors.name : ""}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </Form.Item>
              <div className={styles.datesRow}>
                <Form.Item
                  label="Start date"
                  validateStatus={errors?.started_at ? "error" : ""}
                  help={errors?.started_at ? errors.started_at : ""}
                  style={{ width: "100%" }}
                >
                  <Controller
                    name="started_at"
                    control={control}
                    render={(propsController) => (
                      <DatePicker
                        {...propsController}
                        style={{ width: "100%" }}
                        value={propsController.field.value}
                        onChange={(e) => {
                          // @ts-ignore
                          propsController.field.onChange(e)
                          setDateFrom(e)
                        }}
                        disabledDate={disabledDateFrom}
                      />
                    )}
                  />
                </Form.Item>
                <span>-</span>
                <Form.Item
                  label="Due date"
                  validateStatus={errors?.due_date ? "error" : ""}
                  help={errors?.due_date ? errors.due_date : ""}
                  style={{ width: "100%" }}
                >
                  <Controller
                    name="due_date"
                    control={control}
                    render={(propsController) => (
                      <DatePicker
                        {...propsController}
                        style={{ width: "100%" }}
                        value={propsController.field.value}
                        onChange={(e) => {
                          // @ts-ignore
                          propsController.field.onChange(e)
                          setDateTo(e)
                        }}
                        disabledDate={disabledDateTo}
                      />
                    )}
                  />
                </Form.Item>
              </div>
              <Form.Item
                label="Parent"
                validateStatus={errors?.parent ? "error" : ""}
                help={errors?.parent ? errors.parent : ""}
              >
                <Controller
                  name="parent"
                  control={control}
                  render={() => (
                    <TestPlanParentField
                      handleSelectParent={handleSelectParent}
                      selectedParent={selectedParent}
                      handleClearParent={handleClearParent}
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Description"
                validateStatus={errors?.description ? "error" : ""}
                help={errors?.description ? errors.description : ""}
              >
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Input.TextArea rows={4} {...field} />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Test Cases"
                validateStatus={errors?.test_cases ? "error" : ""}
                help={errors?.test_cases ? errors.test_cases : ""}
              >
                <Controller
                  name="test_cases"
                  control={control}
                  render={({ field }) => {
                    const onlyTestCases = field.value?.filter((tc) => !tc.startsWith("TS")) || []
                    return (
                      <>
                        <Search
                          placeholder="Search"
                          onChange={(e) => handleSearch(testSuites, e.target.value)}
                          value={searchText}
                          style={{ marginBottom: "8px" }}
                        />
                        <Tree
                          {...field}
                          titleRender={(node) => (
                            <HighLighterTesty
                              searchWords={searchText}
                              textToHighlight={String(node.title)}
                            />
                          )}
                          height={200}
                          virtual={false}
                          showIcon={true}
                          checkable={true}
                          selectable={false}
                          treeData={TreeUtils.deleteChildren<ITestPlanTreeView | ISuite>(
                            filterTable.length ? filterTable : testSuites || []
                          )}
                          checkedKeys={field.value || []}
                          //@ts-ignore
                          onCheck={field.onChange}
                          expandedKeys={expandedRowKeys}
                          onExpand={(_, record) => {
                            handleRowExpand(expandedRowKeys, String(record.node.key))
                          }}
                        />
                        <span style={{ opacity: 0.7, marginTop: 4 }}>
                          Selected: {onlyTestCases.length} test cases
                        </span>
                      </>
                    )
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </Modal>
  )
}
