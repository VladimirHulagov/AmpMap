import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { invalidatesList } from "shared/libs"

import { setTest } from "../model"

const rootPath = "v1/tests"

export const testApi = createApi({
  reducerPath: "testApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Test"],
  endpoints: (builder) => ({
    getTest: builder.query<Test, string>({
      query: (testId) => ({
        url: `${rootPath}/${testId}/`,
      }),
      providesTags: (result, error, id) => [{ type: "Test", id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setTest(data))
        } catch (error) {
          console.error(error)
        }
      },
    }),
    getTests: builder.query<PaginationResponse<Test[]>, QueryWithPagination<ITestGetWithFilters>>({
      query: (params) => ({
        url: `${rootPath}/`,
        params,
      }),
      providesTags: (data) =>
        data
          ? [
              ...data.results.map(({ id }) => ({
                type: "Test" as const,
                id: String(id),
              })),
            ]
          : [{ type: "Test", id: "LIST" }],
    }),
    updateTest: builder.mutation<Test, { id: Id; body: TestUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) => invalidatesList(result, "Test"),
    }),
  }),
})

export const { useLazyGetTestsQuery, useLazyGetTestQuery, useUpdateTestMutation } = testApi
