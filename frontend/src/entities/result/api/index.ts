import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit"
import { createApi } from "@reduxjs/toolkit/dist/query/react"
import { statusInvalidate } from "entities/status/api"

import { baseQueryWithLogout } from "app/apiSlice"

import { testApi } from "entities/test/api"

import { testPlanApi, testPlanStatusesInvalidate } from "entities/test-plan/api"

import { invalidatesList, providesList } from "shared/libs"

const invalidateListTags = (
  testPlanId: number,
  testId: number,
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>
) => {
  dispatch(testApi.util.invalidateTags([{ type: "Test", id: testId }]))

  dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanStatistics", id: testPlanId }]))
  dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanHistogram", id: testPlanId }]))

  dispatch(statusInvalidate)
  dispatch(testPlanStatusesInvalidate(testPlanId))
}

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
      providesTags: (result) => providesList(result, "Result"),
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
          invalidateListTags(testPlanId, data.test, dispatch)
          dispatch(testApi.util.invalidateTags([{ type: "Test", id: "LIST" }]))
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: (result) => invalidatesList(result, "Result"),
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
          invalidateListTags(testPlanId, data.test, dispatch)
          dispatch(testApi.util.invalidateTags([{ type: "Test", id: "LIST" }]))
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: [{ type: "Result", id: "LIST" }],
    }),
  }),
})

export const { useCreateResultMutation, useUpdateResultMutation, useLazyGetResultsQuery } =
  resultApi
