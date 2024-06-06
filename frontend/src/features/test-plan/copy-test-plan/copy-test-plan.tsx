import { CopyOutlined } from "@ant-design/icons"
import { Alert, Button, Checkbox, Form, Input, Modal } from "antd"
import dayjs from "dayjs"
import { Controller } from "react-hook-form"
import { useParams } from "react-router-dom"

import { useLazyGetTestPlansQuery } from "entities/test-plan/api"

import { DateFormItem, SearchFormItem } from "shared/ui"

import styles from "./styles.module.css"
import { useTestPlanCopyModal } from "./use-copy-test-plan"

export const CopyTestPlan = ({ testPlan }: { testPlan: TestPlan }) => {
  const { projectId } = useParams<ParamProjectId>()
  const [getPlans] = useLazyGetTestPlansQuery()

  const {
    isShow,
    isLoading,
    handleClearSelected,
    handleCancel,
    handleShow,
    selectedPlan,
    handleSelectPlan,
    errors,
    formErrors,
    control,
    handleSubmitForm,
    isDisabled,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
  } = useTestPlanCopyModal(testPlan)

  return (
    <>
      <Button id="copy-test-plan" icon={<CopyOutlined />} onClick={handleShow}>
        Copy
      </Button>
      <Modal
        className="copy-test-plan-modal"
        title={`Copy Test Plan '${testPlan.name}'`}
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="cancel-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            id="save-btn"
            key="submit"
            type="primary"
            loading={isLoading}
            onClick={handleSubmitForm}
            disabled={isDisabled}
          >
            Save
          </Button>,
        ]}
      >
        <Form id="copy-test-plan-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item label="New plan name">
            <Controller
              name="new_name"
              control={control}
              render={({ field }) => (
                <Input
                  id="copy-test-plan-form-name"
                  placeholder="Please enter a name"
                  {...field}
                  autoFocus={true}
                />
              )}
            />
          </Form.Item>
          <SearchFormItem
            id="copy-test-plan-select"
            control={control}
            name="plan"
            label="Parent plan"
            formErrors={formErrors}
            externalErrors={errors}
            options={{
              //@ts-ignore
              getData: getPlans,
              onSelect: handleSelectPlan,
              onClear: handleClearSelected,
              dataParams: {
                project: projectId,
              },
              selected: selectedPlan,
              placeholder: "Search a test plan",
              searchKey: "search",
            }}
          />
          <div className={styles.datesRow}>
            <DateFormItem
              id="copy-test-plan-start-date"
              control={control}
              label="Start date"
              name="startedAt"
              setDate={setDateFrom}
              disabledDate={disabledDateFrom}
              formStyles={{ width: "100%" }}
              formErrors={formErrors}
              externalErrors={errors}
              defaultDate={dayjs()}
            />
            <span>-</span>
            <DateFormItem
              id="copy-test-plan-due-date"
              control={control}
              label="Due date"
              name="dueDate"
              setDate={setDateTo}
              disabledDate={disabledDateTo}
              formStyles={{ width: "100%" }}
              formErrors={formErrors}
              externalErrors={errors}
              defaultDate={dayjs().add(1, "day")}
            />
          </div>
          <Form.Item name="Keep Assignee">
            <Controller
              name="keepAssignee"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                >
                  Include Test Cases Assignment
                </Checkbox>
              )}
            />
          </Form.Item>
        </Form>
        {!!errors.length && (
          <Alert style={{ marginBottom: 0, marginTop: 16 }} description={errors} type="error" />
        )}
      </Modal>
    </>
  )
}
