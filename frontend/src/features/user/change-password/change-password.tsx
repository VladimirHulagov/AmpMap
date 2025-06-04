import { LockOutlined } from "@ant-design/icons"
import { Form, Input, Modal } from "antd"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ErrorObj } from "shared/hooks"
import { AlertError, Button } from "shared/ui"

import { useChangePassword } from "./use-change-password"

const TEST_ID = "change-password"

export const ChangePassword = () => {
  const { t } = useTranslation()
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
        color="secondary-linear"
      >
        {t("Change password")}
      </Button>
      <Modal
        bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
        wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
        title={<span data-testid={`${TEST_ID}-modal-title`}>{t("Change password")}</span>}
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="cancel-btn" key="back" onClick={handleCancel} color="secondary-linear">
            {t("Cancel")}
          </Button>,
          <Button
            id="save-btn"
            key="submit"
            color="accent"
            onClick={handleSubmit(handleSave)}
            disabled={saveDisabled}
          >
            {t("Save")}
          </Button>,
        ]}
      >
        <Form id="change-password-form" layout="vertical" onFinish={handleSubmit(handleSave)}>
          <Form.Item
            label={t("Password")}
            validateStatus={errors?.password ? "error" : ""}
            help={
              errors?.password ? (
                <span data-testid="change-password-form-password-error">{errors.password}</span>
              ) : (
                ""
              )
            }
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
            label={t("Confirm Password")}
            dependencies={["password"]}
            validateStatus={errors?.confirm ? "error" : ""}
            help={
              errors?.confirm ? (
                <span data-testid="change-password-form-confirm-error">{errors.confirm}</span>
              ) : (
                ""
              )
            }
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
