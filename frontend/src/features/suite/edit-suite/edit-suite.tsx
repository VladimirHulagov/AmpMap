import { EditOutlined } from "@ant-design/icons"
import { Button, Form, Input, Modal, TreeSelect } from "antd"
import { Controller } from "react-hook-form"

import { AlertError } from "shared/ui"

import { useSuiteEditModal } from "./use-suite-edit-modal"

export const EditSuite = () => {
  const {
    isShow,
    control,
    isLoadingUpdating,
    isLoadingTreeSuites,
    isDirty,
    errors,
    selectedParent,
    treeSuites,
    testSuite,
    handleClearParent,
    handleSelectParent,
    handleSubmitForm,
    handleCancel,
    handleShowEdit,
  } = useSuiteEditModal()

  return (
    <>
      <Button id="edit-test-suite" onClick={handleShowEdit} icon={<EditOutlined />}>
        Edit
      </Button>
      <Modal
        className="edit-test-suite-modal"
        title={`Edit Test Suite '${testSuite?.name}'`}
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="clear-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            id="update-btn"
            key="submit"
            type="primary"
            loading={isLoadingUpdating}
            onClick={handleSubmitForm}
            disabled={!isDirty}
          >
            Update
          </Button>,
        ]}
      >
        {errors ? <AlertError error={errors} skipFields={["name", "parent"]} /> : null}

        <Form id="edit-test-suite-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label="Name"
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="edit-test-suite-form-name" {...field} />}
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
                  id="edit-test-suite-form-parent"
                  style={{ width: "100%" }}
                  dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                  treeData={treeSuites?.results}
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
                  dropdownRender={(menu) => <div id="edit-test-suite-dropdown">{menu}</div>}
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
                <Input.TextArea id="edit-test-suite-form-description" rows={4} {...field} />
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
