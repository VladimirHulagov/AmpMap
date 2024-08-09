import { CopyOutlined } from "@ant-design/icons"
import { Alert, Button, Form, Modal } from "antd"
import { useParams } from "react-router-dom"

import { useLazyGetTestPlansQuery } from "entities/test-plan/api"

import { SearchFormItem } from "shared/ui"

import { MoveTestsProps, useMoveTestsModal } from "./use-move-tests"

export const MoveTests = (props: MoveTestsProps) => {
  const { projectId } = useParams<ParamProjectId>()
  const [getPlans] = useLazyGetTestPlansQuery()

  const {
    isShow,
    handleClearSelected,
    handleCancel,
    handleShow,
    selectedPlan,
    handleSelectPlan,
    errors,
    formErrors,
    control,
    handleSubmitForm,
  } = useMoveTestsModal(props)

  return (
    <>
      <Button id="move-tests" icon={<CopyOutlined />} onClick={handleShow}>
        Move tests
      </Button>
      <Modal
        className="move-tests-modal"
        title={`Move Test To Plan`}
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="cancel-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button id="save-btn" key="submit" type="primary" onClick={handleSubmitForm}>
            Save
          </Button>,
        ]}
      >
        <Form id="move-tests-form" layout="vertical" onFinish={handleSubmitForm}>
          <SearchFormItem
            id="move-tests-select"
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
                is_flat: true,
              },
              selected: selectedPlan,
              placeholder: "Search a test plan",
              searchKey: "search",
            }}
          />
        </Form>
        {!!errors.length && (
          <Alert style={{ marginBottom: 0, marginTop: 16 }} description={errors} type="error" />
        )}
      </Modal>
    </>
  )
}
