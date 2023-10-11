import { Button, Form, Input, Modal, TreeSelect } from "antd"
import { Control, Controller } from "react-hook-form"

import { AlertError } from "shared/ui"

type ErrorData = {
  name?: string
  parent?: string
  description?: string
}

interface CreateEditTestSuiteModalProps {
  props: {
    isShow: boolean
    isEditMode: boolean
    testSuite: ISuite | null
    treeSuites: ISuite[] | undefined
    isLoadingCreating: boolean
    isLoadingUpdating: boolean
    isLoadingTreeSuites: boolean
    isDirty: boolean
    errors: ErrorData | null
    control: Control<ISuiteUpdate, unknown>
    selectedParent: number | null
    handleCancel: () => void
    handleClearParent: () => void
    handleSelectParent: (value: number | null) => void
    handleSubmitForm: (
      e?: React.BaseSyntheticEvent<object, unknown, unknown> | undefined
    ) => Promise<void>
  }
}

export const CreateEditTestSuiteModal = ({
  props: {
    isShow,
    isEditMode,
    testSuite,
    treeSuites,
    isLoadingCreating,
    isLoadingTreeSuites,
    isLoadingUpdating,
    isDirty,
    errors,
    control,
    selectedParent,
    handleCancel,
    handleClearParent,
    handleSelectParent,
    handleSubmitForm,
  },
}: CreateEditTestSuiteModalProps) => {
  return (
    <Modal
      className="create-edit-test-suite-modal"
      title={isEditMode ? `Edit Test Suite '${testSuite?.name}'` : "Create Test Suite"}
      open={isShow}
      onCancel={handleCancel}
      centered
      footer={[
        <Button id="clear-btn" key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          id="update-create-btn"
          key="submit"
          type="primary"
          loading={isLoadingCreating || isLoadingUpdating}
          onClick={handleSubmitForm}
          disabled={!isDirty}
        >
          {isEditMode ? "Update" : "Create"}
        </Button>,
      ]}
    >
      {errors ? <AlertError error={errors} skipFields={["name", "parent"]} /> : null}

      <Form id="create-edit-test-suite-form" layout="vertical" onFinish={handleSubmitForm}>
        <Form.Item
          label="Name"
          validateStatus={errors?.name ? "error" : ""}
          help={errors?.name ? errors.name : ""}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input id="create-edit-test-suite-form-name" {...field} />}
          />
        </Form.Item>
        <Form.Item
          label="Parent Test Suite"
          validateStatus={errors?.parent ? "error" : ""}
          help={errors?.parent ? errors.parent : ""}
        >
          <Controller
            name="parent"
            control={control}
            render={({ field }) => (
              <TreeSelect
                {...field}
                id="create-edit-test-suite-form-parent"
                style={{ width: "100%" }}
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                treeData={treeSuites}
                placeholder="Please select"
                allowClear
                treeDefaultExpandAll
                // @ts-ignore
                onSelect={handleSelectParent}
                onClear={handleClearParent}
                // @ts-ignore
                value={selectedParent}
                loading={isLoadingTreeSuites}
                disabled={isLoadingTreeSuites}
                dropdownRender={(menu) => <div id="create-edit-test-suite-dropdown">{menu}</div>}
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
            render={({ field }) => (
              <Input.TextArea id="create-edit-test-suite-form-description" rows={4} {...field} />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
