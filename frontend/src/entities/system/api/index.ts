import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

const rootPath = "v1/system"

export const systemApi = createApi({
  reducerPath: "systemApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["SystemMessages"],
  endpoints: (builder) => ({
    getSystemMessages: builder.query<SystemMessage[], void>({
      query: () => `${rootPath}/messages`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "SystemMessages" as const,
                id,
              })),
              { type: "SystemMessages", id: "LIST" },
            ]
          : [{ type: "SystemMessages", id: "LIST" }],
    }),
  }),
})

export const { useGetSystemMessagesQuery } = systemApi
