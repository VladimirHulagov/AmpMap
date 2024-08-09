import { LockOutlined } from "@ant-design/icons"
import { Button, Form, Input, Modal } from "antd"
import { Controller } from "react-hook-form"

import { ErrorObj } from "shared/hooks/use-alert-error"
import { AlertError } from "shared/ui"

import { useChangePassword } from "./use-change-password"

export const ChangePassword = () => {
  const {
    handleSave,
    handleCancel,
    handleShow,
    saveDisabled,
    errors,
    control,
    handleSubmit,
    isShow,
    password,
  } = useChangePassword()

  return (
    <>
      <Button
        id="change-password-btn"
        icon={<LockOutlined />}
        onClick={handleShow}
        style={{ marginLeft: 8 }}
      >
        Change password
      </Button>
      <Modal
        className="change-password-modal"
        title={"Change password"}
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
            onClick={handleSubmit(handleSave)}
            disabled={saveDisabled}
          >
            Save
          </Button>,
        ]}
      >
        <Form id="change-password-form" layout="vertical" onFinish={handleSubmit(handleSave)}>
          <Form.Item
            label="Password"
            validateStatus={errors?.password ? "error" : ""}
            help={errors?.password ? errors.password : ""}
            required
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password id={`change-password-form-password`} {...field} />
              )}
            />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            validateStatus={errors?.confirm ? "error" : ""}
            help={errors?.confirm ? errors.confirm : ""}
            required
          >
            <Controller
              name="confirm"
              control={control}
              render={({ field }) => (
                <Input.Password
                  id={`change-password-form-confirm`}
                  {...field}
                  disabled={!!errors?.password || !password}
                />
              )}
            />
          </Form.Item>
        </Form>
        {errors ? (
          <AlertError error={errors as ErrorObj} skipFields={["password", "confirm"]} />
        ) : null}
      </Modal>
    </>
  )
}
