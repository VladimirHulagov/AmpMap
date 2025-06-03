import { Alert, Checkbox, Form, Input } from "antd"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import { useAuthLogic } from "./model/Auth.logic"

export const Auth = () => {
  const { t } = useTranslation()
  const { control, errMsg, onSubmit, isLoading } = useAuthLogic()

  return (
    <>
      {errMsg ? (
        <Alert
          style={{ marginBottom: 24 }}
          description={<span data-testid="error-alert-description">{errMsg}</span>}
          type="error"
        />
      ) : null}

      <Form onFinish={onSubmit} layout="vertical">
        <Form.Item label={t("Username")}>
          <Controller
            name="username"
            control={control}
            render={({ field }) => <Input {...field} data-testid="username-input" />}
          />
        </Form.Item>
        <Form.Item label={t("Password")} name="password" style={{ marginBottom: 8 }}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => <Input.Password {...field} data-testid="password-input" />}
          />
        </Form.Item>
        <Form.Item name="remember_me">
          <Controller
            name="remember_me"
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                data-testid="remember-me-checkbox"
              >
                {t("Remember me")}
              </Checkbox>
            )}
          />
        </Form.Item>
        <Form.Item>
          <Button
            size="l"
            color="accent"
            type="submit"
            block
            loading={isLoading}
            style={{ width: "100%" }}
            data-testid="login-button"
          >
            {t("Login")}
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}
