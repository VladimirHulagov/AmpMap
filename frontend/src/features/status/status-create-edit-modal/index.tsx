import { Button, ColorPicker, Form, Input, Modal } from "antd"
import { useAdministrationStatusModal } from "entities/status/model"
import { Controller } from "react-hook-form"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  data: ReturnType<typeof useAdministrationStatusModal>
}

export const StatusCreateEditModal = ({ data }: Props) => {
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
  } = data
  return (
    <Modal
      className="create-edit-status-modal"
      title={title}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id="close-update-create-status" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          id="update-create-status"
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
        {errors ? <AlertError error={errors as ErrorObj} skipFields={["name"]} /> : null}

        <Form id="create-edit-status-form" layout="vertical" onFinish={handleSubmitForm}>
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
            label="Color"
            validateStatus={errors?.color ? "error" : ""}
            help={errors?.color ? errors.color : ""}
          >
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value}
                  showText
                  format="rgb"
                  className={styles.colorPicker}
                  onChangeComplete={(color) => {
                    field.onChange(color.toRgbString())
                  }}
                />
              )}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}
