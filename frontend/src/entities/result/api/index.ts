import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit"
import { createApi } from "@reduxjs/toolkit/dist/query/react"
import { statusInvalidate } from "entities/status/api"

import { baseQueryWithLogout } from "app/apiSlice"

import { openTestResults } from "entities/result/model/slice"

import { testApi, testRelatedEntitiesInvalidate } from "entities/test/api"

import { testPlanApi, testPlanStatusesInvalidate } from "entities/test-plan/api"

import { invalidatesList, providesList } from "shared/libs"

const invalidateListTags = (
  projectId: number | string,
  testPlanId: number | string,
  testId: number,
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>
) => {
  dispatch(testApi.util.invalidateTags([{ type: "Test", id: testId }]))

  dispatch(
    testPlanApi.util.invalidateTags([
      { type: "TestPlanStatistics", id: `${projectId}-${testPlanId}` },
    ])
  )
  dispatch(
    testPlanApi.util.invalidateTags([
      { type: "TestPlanHistogram", id: `${projectId}-${testPlanId}` },
    ])
  )

  dispatch(statusInvalidate)
  dispatch(testPlanStatusesInvalidate(testPlanId))
}

const rootPath = "results"

export const resultApi = createApi({
  reducerPath: "resultApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Result"],
  endpoints: (builder) => ({
    getResults: builder.query<Result[], ResultQuery>({
      query: ({ testId, showArchive, project }) => ({
        url: `${rootPath}/`,
        params: { test: testId, is_archive: showArchive, project },
      }),
      providesTags: (result) => providesList(result, "Result"),
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled

          if (data) {
            dispatch(openTestResults([data[0].id]))
          }
        } catch (error) {
          console.error(error)
        }
      },
    }),
    updateResult: builder.mutation<Result, { id: Id; testPlanId: Id | null; body: ResultUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ testPlanId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          invalidateListTags(data.project, testPlanId ?? "LIST", data.test, dispatch)
          dispatch(testApi.util.invalidateTags([{ type: "Test", id: "LIST" }]))
          dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanTest", id: "LIST" }]))
          dispatch(testRelatedEntitiesInvalidate)
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: (result, error) => (!error ? invalidatesList(result, "Result") : []),
    }),
    createResult: builder.mutation<Result, { testPlanId: Id | null; body: ResultCreate }>({
      query: ({ body }) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      async onQueryStarted({ testPlanId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          invalidateListTags(data.project, testPlanId ?? "LIST", data.test, dispatch)
          dispatch(testApi.util.invalidateTags([{ type: "Test", id: "LIST" }]))
          dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanTest", id: "LIST" }]))
          dispatch(testRelatedEntitiesInvalidate)
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
