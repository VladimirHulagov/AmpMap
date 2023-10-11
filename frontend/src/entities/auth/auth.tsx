import { Alert, Button, Form, Input } from "antd"
import { Controller } from "react-hook-form"

import { useAuthLogic } from "./model/Auth.logic"

export const Auth = () => {
  const { control, errMsg, onSubmit, isLoading } = useAuthLogic()

  return (
    <>
      {errMsg ? <Alert style={{ marginBottom: 24 }} description={errMsg} type="error" /> : null}

      <Form onFinish={onSubmit} layout="vertical">
        <Form.Item label="Username">
          <Controller
            name="username"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label="Password" name="password">
          <Controller
            name="password"
            control={control}
            render={({ field }) => <Input.Password {...field} />}
          />
        </Form.Item>
        <Form.Item>
          <Button
            id="login-btn"
            size="large"
            type="primary"
            htmlType="submit"
            block
            loading={isLoading}
          >
            Login
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}
