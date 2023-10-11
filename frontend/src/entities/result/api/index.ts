import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { testApi } from "entities/test/api"

import { testPlanApi } from "entities/test-plan/api"

export const resultApi = createApi({
  reducerPath: "resultApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Result"],
  endpoints: (builder) => ({
    getResults: builder.query<IResult[], IResultQuery>({
      query: ({ testId, showArchive, project }) => ({
        url: "v1/results/",
        params: { test: testId, is_archive: showArchive, project },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Result" as const,
                id,
              })),
              { type: "Result", id: "LIST" },
            ]
          : [{ type: "Result", id: "LIST" }],
    }),
    updateResult: builder.mutation<IResult, { id: Id; testPlanId: Id; body: IResultUpdate }>({
      query: ({ id, body }) => ({
        url: `v1/results/${id}/`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ testPlanId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(testApi.util.invalidateTags([{ type: "Test", id: data.test }]))

          dispatch(
            testPlanApi.util.invalidateTags([{ type: "TestPlanStatistics", id: testPlanId }])
          )
          dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanHistogram", id: testPlanId }]))
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "Result", id },
              { type: "Result", id: "LIST" },
            ]
          : [{ type: "Result", id: "LIST" }],
    }),
    createResult: builder.mutation<IResult, { testPlanId: Id; body: IResultCreate }>({
      query: ({ body }) => ({
        url: "v1/results/",
        method: "POST",
        body,
      }),
      async onQueryStarted({ testPlanId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(testApi.util.invalidateTags([{ type: "Test", id: data.test }]))

          dispatch(
            testPlanApi.util.invalidateTags([{ type: "TestPlanStatistics", id: testPlanId }])
          )
          dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanHistogram", id: testPlanId }]))
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: [{ type: "Result", id: "LIST" }],
    }),
  }),
})

export const {
  useCreateResultMutation,
  useUpdateResultMutation,
  useGetResultsQuery,
  useLazyGetResultsQuery,
} = resultApi
