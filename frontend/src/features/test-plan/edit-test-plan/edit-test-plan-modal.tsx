import { Button, Col, Form, Modal, Row, Tree } from "antd"
import Search from "antd/lib/input/Search"
import { Controller } from "react-hook-form"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { TreeUtils } from "shared/libs"
import {
  AlertError,
  ContainerLoader,
  DateFormItem,
  HighLighterTesty,
  InputFormItem,
  SearchFormItemOld,
  TextAreaFormItem,
} from "shared/ui"

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
    formErrors,
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
            <InputFormItem
              id="edit-test-plan-name"
              control={control}
              name="name"
              maxLength={100}
              required
              formErrors={formErrors}
              externalErrors={errors}
            />
            <div className={styles.datesRow}>
              <DateFormItem
                id="edit-test-plan-start-date"
                control={control}
                label="Start date"
                name="started_at"
                setDate={setDateFrom}
                disabledDate={disabledDateFrom}
                formStyles={{ width: "100%" }}
                formErrors={formErrors}
                externalErrors={errors}
              />
              <span>-</span>
              <DateFormItem
                id="edit-test-plan-start-date"
                control={control}
                label="Due date"
                name="due_date"
                setDate={setDateTo}
                disabledDate={disabledDateTo}
                formStyles={{ width: "100%" }}
                formErrors={formErrors}
                externalErrors={errors}
              />
            </div>
            <SearchFormItemOld
              id="edit-test-plan-parent"
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
              id="edit-test-plan-desc"
              control={control}
              name="description"
              formErrors={formErrors}
              externalErrors={errors}
            />
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
