import { Alert } from "antd"

import { ErrorObj, useAlertError } from "shared/hooks/use-alert-error"

interface AlertErrorProps {
  error: ErrorObj
  skipFields: string[]
}

export const AlertError = ({ error, skipFields }: AlertErrorProps) => {
  const errors = useAlertError(error, skipFields)

  return errors && <Alert style={{ marginBottom: 24 }} description={errors.errors} type="error" />
}
