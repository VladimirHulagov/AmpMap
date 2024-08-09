import { Button, Col, Form, Modal, Row, Tree, Typography } from "antd"
import dayjs from "dayjs"
import { Controller } from "react-hook-form"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { TreeUtils } from "shared/libs"
import {
  AlertError,
  ArchivedTag,
  ContainerLoader,
  DateFormItem,
  InputFormItem,
  SearchFormItemOld,
  TextAreaFormItem,
  TreeSelectFormItem,
} from "shared/ui"

import { TestCaseLabels } from "../test-case-labels/test-case-labels"
import { useTestCasesFilter } from "../test-cases-filter/use-test-cases-filter"
import styles from "./styles.module.css"
import { useTestPlanCreateModal } from "./use-test-plan-create-modal"

interface CreateTestPlanModalProps {
  isShow: boolean
  setIsShow: React.Dispatch<React.SetStateAction<boolean>>
  testPlan?: TestPlan
}

export const CreateTestPlanModal = ({ isShow, setIsShow, testPlan }: CreateTestPlanModalProps) => {
  const {
    isLoadingCreateTestPlan,
    isLoadingTreeData,
    isLoadingTestPlans,
    dataTestPlans,
    errors,
    formErrors,
    control,
    searchText,
    treeData,
    parametersTreeView,
    expandedRowKeys,
    isDirty,
    isLastPage,
    selectedParent,
    handleRowExpand,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
    handleSubmitForm,
    handleClose,
    handleSearch,
    handleTestCaseChange,
    handleClearTestPlan,
    handleLoadNextPageData,
    handleSearchTestPlan,
    handleSelectTestPlan,
    selectedLables,
    labelProps,
    lableCondition,
    handleConditionClick,
    showArchived,
    handleToggleArchived,
  } = useTestPlanCreateModal({
    isShow,
    setIsShow,
    testPlan,
  })

  const { FilterButton, FilterForm } = useTestCasesFilter({
    labelProps,
    searchText,
    handleSearch,
    selectedLables,
    lableCondition,
    handleConditionClick,
    showArchived,
    handleToggleArchived,
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
            error={errors as ErrorObj}
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
              <InputFormItem
                id="create-test-plan-name"
                control={control}
                name="name"
                maxLength={100}
                required
                formErrors={formErrors}
                externalErrors={errors}
              />
              <div className={styles.datesRow}>
                <DateFormItem
                  id="create-test-plan-start-date"
                  control={control}
                  label="Start date"
                  name="started_at"
                  setDate={setDateFrom}
                  disabledDate={disabledDateFrom}
                  formStyles={{ width: "100%" }}
                  formErrors={formErrors}
                  externalErrors={errors}
                  defaultDate={dayjs()}
                />
                <span>-</span>
                <DateFormItem
                  id="create-test-plan-due-date"
                  control={control}
                  label="Due date"
                  name="due_date"
                  setDate={setDateTo}
                  disabledDate={disabledDateTo}
                  formStyles={{ width: "100%" }}
                  formErrors={formErrors}
                  externalErrors={errors}
                  defaultDate={dayjs().add(1, "day")}
                />
              </div>
              <SearchFormItemOld
                id="create-test-plan-parent"
                name="parent"
                placeholder="Search a test plan"
                valueKey="title"
                control={control}
                formErrors={formErrors}
                externalErrors={errors}
                options={{
                  selectedParent,
                  isLastPage,
                  isLoading: isLoadingTestPlans,
                  data: dataTestPlans,
                  onClear: handleClearTestPlan,
                  onSearch: handleSearchTestPlan,
                  onChange: handleSelectTestPlan,
                  onLoadNextPageData: handleLoadNextPageData,
                }}
              />
              <TextAreaFormItem
                id="create-test-plan-desc"
                control={control}
                name="description"
                formErrors={formErrors}
                externalErrors={errors}
              />
            </Col>
            <Col span={12}>
              <TreeSelectFormItem
                id="create-test-plan-parameters"
                control={control}
                name="parameters"
                treeData={parametersTreeView}
                formErrors={formErrors}
                externalErrors={errors}
              />
              <Form.Item
                label={
                  <div style={{ display: "flex" }}>
                    <Typography.Paragraph>Test Cases</Typography.Paragraph>
                    {FilterButton}
                  </div>
                }
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
                        {FilterForm}
                        {isLoadingTreeData && <ContainerLoader />}
                        {!isLoadingTreeData && (
                          <>
                            <Tree
                              {...field}
                              //@ts-ignore
                              titleRender={(node: TestPlanTreeView) => {
                                return (
                                  <>
                                    {node.is_archive && <ArchivedTag />}
                                    {node.title}
                                    {node.labels ? <TestCaseLabels labels={node.labels} /> : null}
                                  </>
                                )
                              }}
                              height={200}
                              virtual={false}
                              showIcon={true}
                              checkable={true}
                              selectable={false}
                              //@ts-ignore
                              treeData={TreeUtils.deleteChildren<Suite>(treeData)}
                              checkedKeys={field.value}
                              // @ts-ignore
                              onCheck={handleTestCaseChange}
                              expandedKeys={expandedRowKeys}
                              onExpand={(_, record) => {
                                handleRowExpand(expandedRowKeys, String(record.node.key))
                              }}
                            />
                            <span style={{ opacity: 0.7, marginTop: 4 }}>
                              Selected: {testCases.length} test cases
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
      </>
    </Modal>
  )
}
