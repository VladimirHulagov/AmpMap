import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryAuth } from "app/apiSlice"

import { logout } from "../model"

export const getCsrfCookie = () => {
  const cookies = document.cookie.split(";")
  let csrfToken = ""

  cookies.forEach((cookie) => {
    if (cookie.trim().startsWith("csrftoken=")) {
      csrfToken = cookie.split("=")[1]
    }
  })

  return csrfToken
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryAuth,
  endpoints: (builder) => ({
    login: builder.mutation<void, { password: string; username: string; remember_me: boolean }>({
      query: (credentials) => ({
        url: "login/",
        method: "POST",
        body: { ...credentials },
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          await queryFulfilled
        } catch (error) {
          console.error(error)
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "logout/",
        method: "POST",
        headers: { "X-CSRFToken": getCsrfCookie() },
        body: {},
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled

          dispatch(logout())
        } catch (error) {
          console.error(error)
          dispatch(logout())
        }
      },
    }),
  }),
})

export const { useLoginMutation, useLogoutMutation } = authApi
