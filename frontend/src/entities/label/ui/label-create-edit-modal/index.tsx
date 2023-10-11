import { Button, Form, Input, Modal, Select } from "antd"
import { Controller } from "react-hook-form"

import { useAdministrationLabelModal } from "entities/label/model"

import { labelTypes } from "shared/config/label-types"
import { AlertError } from "shared/ui"

export const LabelCreateEditModal = () => {
  const {
    title,
    isShow,
    mode,
    isLoading,
    errors,
    control,
    isDirty,
    handleCancel,
    handleSubmitForm,
  } = useAdministrationLabelModal()
  return (
    <Modal
      className="create-edit-label-modal"
      title={title}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id="close-update-create-label" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          id="update-create-label"
          loading={isLoading}
          key="submit"
          onClick={handleSubmitForm}
          type="primary"
          disabled={!isDirty}
        >
          {mode === "edit" ? "Update" : "Create"}
        </Button>,
      ]}
    >
      <>
        {errors ? <AlertError error={errors} skipFields={["name"]} /> : null}

        <Form id="create-edit-label-form" layout="vertical" onFinish={handleSubmitForm}>
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
          <Form.Item
            label="Type"
            validateStatus={errors?.type ? "error" : ""}
            help={errors?.type ? errors.type : ""}
          >
            <Controller
              name="type"
              control={control}
              defaultValue={0}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Please select"
                  style={{ width: "100%" }}
                  options={labelTypes}
                />
              )}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}
