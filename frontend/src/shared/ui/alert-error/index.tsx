import { Alert } from "antd"

import { ErrorObj, useAlertError } from "shared/hooks/use-alert-error"

interface AlertErrorProps<T> {
  error: T
  skipFields: string[]
}

export const AlertError = <T extends ErrorObj>({ error, skipFields }: AlertErrorProps<T>) => {
  const errors = useAlertError(error, skipFields)

  return errors && <Alert style={{ marginBottom: 24 }} description={errors.errors} type="error" />
}
