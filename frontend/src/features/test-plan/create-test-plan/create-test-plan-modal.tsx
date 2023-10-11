import { Button, Col, DatePicker, Form, Input, Modal, Row, Tree, TreeSelect } from "antd"
import Search from "antd/lib/input/Search"
import moment from "moment"
import { Controller } from "react-hook-form"

import { TestPlanParentField } from "entities/test-plan/ui/parent-field"

import { TreeUtils } from "shared/libs"
import { AlertError } from "shared/ui"
import { HighLighterTesty } from "shared/ui"

import styles from "./styles.module.css"
import { useTestPlanCreateModal } from "./use-test-plan-create-modal"

interface CreateTestPlanModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
}

export const CreateTestPlanModal = ({ isShow, setIsShow }: CreateTestPlanModalProps) => {
  const {
    isLoadingCreateTestPlan,
    errors,
    control,
    searchText,
    testSuites,
    filterTable,
    parametersTreeView,
    expandedRowKeys,
    isDirty,
    selectedParent,
    handleRowExpand,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    handleSubmitForm,
    handleClose,
    handleSearch,
    handleSelectParent,
    handleClearParent,
    handleTestCaseChange,
  } = useTestPlanCreateModal({
    isShow,
    setIsShow,
  })

  return (
    <Modal
      className="test-plan-create-modal"
      title="Create Test Plan"
      open={isShow}
      onCancel={handleClose}
      width="1100px"
      centered
      footer={[
        <Button id="close-test-plan-create" key="back" onClick={handleClose}>
          Close
        </Button>,
        <Button
          id="create-test-plan-create"
          key="submit"
          type="primary"
          loading={isLoadingCreateTestPlan}
          onClick={handleSubmitForm}
          disabled={!isDirty}
        >
          Create
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError
            error={errors}
            skipFields={[
              "name",
              "description",
              "parent",
              "parameters",
              "test_cases",
              "started_at",
              "due_date",
            ]}
          />
        ) : null}

        <Form id="test-plan-create-form" layout="vertical" onFinish={handleSubmitForm}>
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
                    defaultValue={moment()}
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
                    defaultValue={moment().add(1, "day")}
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
                label="Parameters"
                validateStatus={errors?.parameters ? "error" : ""}
                help={errors?.parameters ? errors.parameters : ""}
              >
                <Controller
                  name="parameters"
                  control={control}
                  render={({ field }) => (
                    <TreeSelect
                      {...field}
                      showSearch
                      treeCheckable
                      treeNodeFilterProp="title"
                      style={{ width: "100%" }}
                      dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                      treeData={parametersTreeView}
                      placeholder="Please select"
                      allowClear
                      showCheckedStrategy="SHOW_CHILD"
                    />
                  )}
                />
              </Form.Item>
              <Form.Item
                label="Test Cases"
                validateStatus={errors?.test_cases ? "error" : ""}
                help={errors?.test_cases ? errors.test_cases : ""}
              >
                <Controller
                  name="test_cases"
                  control={control}
                  render={({ field }) => {
                    const testCases = field.value.filter((item: string) => !item.startsWith("TS"))
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
                          treeData={TreeUtils.deleteChildren<ISuite>(
                            filterTable.length ? filterTable : testSuites || []
                          )}
                          checkedKeys={field.value}
                          // @ts-ignore
                          onCheck={handleTestCaseChange}
                          expandedKeys={expandedRowKeys}
                          onExpand={(_, record) =>
                            handleRowExpand(expandedRowKeys, String(record.node.key))
                          }
                        />
                        <span style={{ opacity: 0.7, marginTop: 4 }}>
                          Selected: {testCases.length} test cases
                        </span>
                      </>
                    )
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </>
    </Modal>
  )
}
