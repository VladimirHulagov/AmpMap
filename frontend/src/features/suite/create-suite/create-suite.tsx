import { PlusOutlined } from "@ant-design/icons"
import { Button, Form, Input, Modal } from "antd"
import { Controller } from "react-hook-form"

import { TestSuiteParentField } from "entities/suite/ui/test-suite-parent-field"

import { AlertError } from "shared/ui"

import { useSuiteCreateModal } from "./use-suite-create-modal"

export const CreateSuite = ({ type = "main" }: { type: "main" | "child" }) => {
  const {
    isShow,
    control,
    isLoadingCreating,
    isDirty,
    errors,
    selectedParent,
    handleClearParent,
    handleSelectParent,
    handleSubmitForm,
    handleCancel,
    handleShowCreate,
  } = useSuiteCreateModal()

  return (
    <>
      <Button
        id="create-test-suite-button"
        style={{ marginLeft: 16 }}
        icon={<PlusOutlined />}
        onClick={handleShowCreate}
        type={"primary"}
      >
        {type === "main" ? "Create Test Suite" : "Create Child Test Suite"}
      </Button>
      <Modal
        className="create-test-suite-modal"
        title="Create Test Suite"
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="clear-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            id="create-btn"
            key="submit"
            type="primary"
            loading={isLoadingCreating}
            onClick={handleSubmitForm}
            disabled={!isDirty}
          >
            Create
          </Button>,
        ]}
      >
        {errors ? <AlertError error={errors} skipFields={["name", "parent"]} /> : null}

        <Form id="create-test-suite-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label="Name"
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="create-test-suite-form-name" {...field} />}
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
              render={() => (
                <TestSuiteParentField
                  handleSelectParent={handleSelectParent}
                  handleClearParent={handleClearParent}
                  selectedParent={selectedParent}
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
                <Input.TextArea id="create-test-suite-form-description" rows={4} {...field} />
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
