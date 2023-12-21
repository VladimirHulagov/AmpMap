import { Button, Form, Input, Modal, Switch } from "antd"
import { Controller } from "react-hook-form"

import { useUserModal } from "entities/user/model"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError } from "shared/ui"

export const CreateEditUserModal = () => {
  const {
    title,
    isEditMode,
    isShow,
    isLoading,
    isActive,
    isStaff,
    isDirty,
    errors,
    control,
    handleCancel,
    handleSubmitForm,
  } = useUserModal()

  return (
    <Modal
      className="create-edit-user-modal"
      title={title}
      open={isShow}
      onCancel={handleCancel}
      width="600px"
      centered
      footer={[
        <Button id="close-create-edit-user" key="back" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          id="create-edit-user"
          loading={isLoading}
          key="submit"
          onClick={handleSubmitForm}
          type="primary"
          disabled={!isDirty}
        >
          {isEditMode ? "Update" : "Create"}
        </Button>,
      ]}
    >
      <>
        {errors ? (
          <AlertError
            error={errors as ErrorObj}
            skipFields={[
              "username",
              "email",
              "password",
              "confirm",
              "first_name",
              "last_name",
              "is_active",
              "is_staff",
            ]}
          />
        ) : null}

        <Form id="create-edit-user-form" layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label="Username"
            validateStatus={errors?.username ? "error" : ""}
            help={errors?.username ? errors.username : ""}
            required
          >
            <Controller
              name="username"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="E-mail"
            validateStatus={errors?.email ? "error" : ""}
            help={errors?.email ? errors.email : ""}
            required
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Password"
            validateStatus={errors?.password ? "error" : ""}
            help={errors?.password ? errors.password : ""}
            required={!isEditMode}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => <Input.Password {...field} />}
            />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            validateStatus={errors?.confirm ? "error" : ""}
            help={errors?.confirm ? errors.confirm : ""}
            required={!isEditMode}
          >
            <Controller
              name="confirm"
              control={control}
              render={({ field }) => <Input.Password {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="First Name"
            validateStatus={errors?.first_name ? "error" : ""}
            help={errors?.first_name ? errors.first_name : ""}
          >
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Last Name"
            validateStatus={errors?.last_name ? "error" : ""}
            help={errors?.last_name ? errors.last_name : ""}
          >
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Active"
            validateStatus={errors?.is_active ? "error" : ""}
            help={errors?.is_active ? errors.is_active : ""}
          >
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => <Switch checked={isActive} {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="Staff"
            validateStatus={errors?.is_staff ? "error" : ""}
            help={errors?.is_staff ? errors.is_staff : ""}
          >
            <Controller
              name="is_staff"
              control={control}
              render={({ field }) => <Switch checked={isStaff} {...field} />}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}
