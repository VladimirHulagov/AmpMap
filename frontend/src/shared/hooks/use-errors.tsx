import { notification } from "antd"
import { Dispatch, SetStateAction } from "react"

import { isFetchBaseQueryError } from "shared/libs"

export const useErrors = <T extends unknown>(onSetErrors: Dispatch<SetStateAction<T | null>>) => {
  const onHandleError = (err: unknown) => {
    if (isFetchBaseQueryError(err)) {
      if (err?.status && err.status === 400) {
        onSetErrors(err.data as T)
      } else {
        console.error(err)
        notification.error({
          message: "Error!",
          description: "Internal server error. Showing in console log.",
        })
      }
    } else {
      console.error(err)
      notification.error({
        message: "Error!",
        description: "Internal server error. Showing in console log.",
      })
    }
  }

  return {
    onHandleError,
  }
}
