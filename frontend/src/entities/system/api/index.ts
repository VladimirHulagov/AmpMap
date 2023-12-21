import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

const rootPath = "v1/system"

export const systemApi = createApi({
  reducerPath: "systemApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["SystemMessages", "SystemStatistic"],
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
    getSystemStats: builder.query<SystemStatistic, void>({
      query: () => `${rootPath}/statistics`,
      providesTags: [{ type: "SystemStatistic", id: "LIST" }],
    }),
  }),
})

export const systemStatsInvalidate = systemApi.util.invalidateTags([
  { type: "SystemStatistic", id: "LIST" },
])

export const { useGetSystemMessagesQuery, useGetSystemStatsQuery } = systemApi
