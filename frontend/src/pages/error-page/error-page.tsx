import { Result } from "antd"
import { ResultStatusType } from "antd/es/result"
import { Link } from "react-router-dom"

import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  code: ResultStatusType
  message: string
}

export const ErrorPage = ({ code, message }: Props) => {
  return (
    <div className={styles.wrapper}>
      <Result
        status={code}
        title={<span data-testid="error-page-code">{code}</span>}
        subTitle={<span data-testid="error-page-message">{message}</span>}
        extra={
          <Button color="secondary-linear" data-testid="error-page-button">
            <Link to="/">Back to Home</Link>
          </Button>
        }
      />
    </div>
  )
}
