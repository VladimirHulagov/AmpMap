import { fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react"
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { Mutex } from "async-mutex"

import { getCsrfCookie } from "entities/auth/api"
import { logout } from "entities/auth/model"

import { config } from "shared/config"
import { savePrevPageUrl } from "shared/libs/local-storage"

const mutex = new Mutex()

const createQuery = (baseUrl: string) => {
  return fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers) => {
      const csrfToken = getCsrfCookie()
      if (csrfToken) {
        headers.set("X-CSRFToken", csrfToken)
      }
      return headers
    },
  })
}

const baseQuery = createQuery(`${config.apiRoot}/api/`)

export const authQuery = createQuery(`${config.apiRoot}/auth/`)

export const baseQueryAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await mutex.waitForUnlock()

  const result = await authQuery(args, api, extraOptions)

  if (result.error?.status === 404) {
    await mutex.waitForUnlock()
    window.location.href = "/404"
  }

  return result
}

export const baseQueryWithLogout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock()

  let result = await baseQuery(args, api, extraOptions)

  if (result.error?.status === 404) {
    await mutex.waitForUnlock()
    window.location.href = "/404"
  }

  if (result?.error?.status === 403) {
    const currentHref = window.location.href
    window.location.href = "/?error=403&errorPage=" + currentHref
  }

  if (result?.error?.status === 401 && window.location.pathname !== "/login") {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        await authQuery("logout/", api, extraOptions)
      } finally {
        savePrevPageUrl(window.location.pathname)
        window.location.href = "/login"
        api.dispatch(logout())
        release()
      }
    } else {
      await mutex.waitForUnlock()
      result = await baseQuery(args, api, extraOptions)
    }
  }

  return result
}
