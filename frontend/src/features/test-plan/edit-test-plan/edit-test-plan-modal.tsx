import { Button, Col, DatePicker, Form, Input, Modal, Row, Tree } from "antd"
import Search from "antd/lib/input/Search"
import { Controller } from "react-hook-form"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { TreeUtils } from "shared/libs"
import { AlertError, ContainerLoader, HighLighterTesty } from "shared/ui"

import { SearchField } from "widgets/search-field"

import styles from "./styles.module.css"
import { useTestPlanEditModal } from "./use-test-plan-edit-modal"

interface TestPlanEditModalProps {
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  testPlan: TestPlanTreeView
}

export const EditTestPlanModal = ({ isShow, setIsShow, testPlan }: TestPlanEditModalProps) => {
  const {
    errors,
    control,
    selectedParent,
    treeData,
    searchText,
    expandedRowKeys,
    isDirty,
    isLoadingUpdate,
    isLoadingSearch,
    isLoadingTestPlans,
    isLastPage,
    dataTestPlans,
    handleClose,
    handleRowExpand,
    handleSearch,
    handleSubmitForm,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    handleTestCaseChange,
    handleClearTestPlan,
    handleLoadNextPageData,
    handleSearchTestPlan,
    handleSelectTestPlan,
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
          error={errors as ErrorObj}
          skipFields={["name", "parent", "test_cases", "started_at", "due_date"]}
        />
      ) : null}
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
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                  <SearchField
                    select={selectedParent}
                    isLastPage={isLastPage}
                    data={dataTestPlans}
                    isLoading={isLoadingTestPlans}
                    onClear={handleClearTestPlan}
                    onSearch={handleSearchTestPlan}
                    onChange={handleSelectTestPlan}
                    handleLoadNextPageData={handleLoadNextPageData}
                    placeholder="Search a test plan"
                    valueKey="title"
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
                  const onlyTestCases = field.value?.filter((tc) => !tc.startsWith("TS")) ?? []
                  return (
                    <>
                      <Search
                        placeholder="Search"
                        onChange={(e) => handleSearch(e.target.value)}
                        value={searchText}
                        style={{ marginBottom: "8px" }}
                      />

                      {isLoadingSearch && <ContainerLoader />}
                      {!isLoadingSearch && (
                        <>
                          <Tree
                            {...field}
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            titleRender={(node: TestPlanTreeView | Suite) => (
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
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            treeData={TreeUtils.deleteChildren<TestPlanTreeView | Suite>(treeData)}
                            checkedKeys={field.value}
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            //@ts-ignore
                            onCheck={handleTestCaseChange}
                            expandedKeys={expandedRowKeys}
                            onExpand={(_, record) => {
                              handleRowExpand(expandedRowKeys, String(record.node.key))
                            }}
                          />
                          <span style={{ opacity: 0.7, marginTop: 4 }}>
                            Selected: {onlyTestCases.length} test cases
                          </span>
                        </>
                      )}
                    </>
                  )
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
