import { Dispatch, SetStateAction } from "react"

import { initInternalError, isFetchBaseQueryError } from "shared/libs"

// prettier-ignore
export const useErrors = <T, >(onSetErrors: Dispatch<SetStateAction<T | null>>) => {
  const onHandleError = (err: unknown) => {
    if (isFetchBaseQueryError(err)) {
      if (err?.status && err.status === 400) {
        onSetErrors(err.data as T)
      } else {
        initInternalError(err)
      }
    } else {
      initInternalError(err)
    }
  }

  return {
    onHandleError,
  }
}
