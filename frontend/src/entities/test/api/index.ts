import { createApi } from "@reduxjs/toolkit/dist/query/react"
import { openComment } from "entities/comments/model/slice"

import { baseQueryWithLogout } from "app/apiSlice"

import { openTestResults } from "entities/result/model/slice"

import { testPlanApi } from "entities/test-plan/api"

import { invalidatesList } from "shared/libs"

const rootPath = "tests"

export const testApi = createApi({
  reducerPath: "testApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Test", "TestRelatedEntities"],
  endpoints: (builder) => ({
    getTest: builder.query<Test, string>({
      query: (testId) => ({
        url: `${rootPath}/${testId}/`,
      }),
      providesTags: (result, error, id) => [{ type: "Test", id }],
    }),
    getTests: builder.query<PaginationResponse<Test[]>, QueryWithPagination<TestGetFilters>>({
      query: (params) => ({
        url: `${rootPath}/`,
        params,
      }),
      providesTags: () => [{ type: "Test", id: "LIST" }],
    }),
    updateTest: builder.mutation<Test, { id: Id; body: TestUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) => invalidatesList(result, "Test"),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanTest", id }]))
      },
    }),
    bulkUpdate: builder.mutation<Test[], TestBulkUpdate>({
      query: (body) => ({
        url: `${rootPath}/bulk-update/`,
        method: "PUT",
        body,
      }),
      async onQueryStarted({ current_plan, plan_id, project }, { dispatch, queryFulfilled }) {
        await queryFulfilled

        const cacheIdCurrentPlan = `${project}-${current_plan}`
        const cacheIdPlan = `${project}-${plan_id ?? null}`

        dispatch(
          testPlanApi.util.invalidateTags([
            { type: "TestPlanStatistics", id: cacheIdCurrentPlan },
            { type: "TestPlanStatistics", id: cacheIdPlan },
          ])
        )
        dispatch(
          testPlanApi.util.invalidateTags([
            { type: "TestPlanHistogram", id: cacheIdCurrentPlan },
            { type: "TestPlanHistogram", id: cacheIdPlan },
          ])
        )
        dispatch(
          testPlanApi.util.invalidateTags([
            { type: "TestPlanLabels", id: "LIST" },
            { type: "TestPlanLabels", id: plan_id },
          ])
        )
        dispatch(
          testPlanApi.util.invalidateTags([
            { type: "TestPlanCasesIds", id: current_plan },
            { type: "TestPlanCasesIds", id: plan_id },
          ])
        )

        dispatch(
          testPlanApi.util.invalidateTags([
            { type: "TestPlanTest", id: "LIST" },
            { type: "TestPlanTest", id: current_plan },
          ])
        )
      },
      invalidatesTags: (result) => invalidatesList(result, "Test"),
    }),
    getRelatedEntities: builder.query<
      PaginationResponse<(Result | CommentType)[]>,
      GetTestRelatedEntitiesParams
    >({
      query: ({ test_id, ...params }) => ({
        url: `${rootPath}/${test_id}/results-union/`,
        params,
      }),
      providesTags: [{ type: "TestRelatedEntities" }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled

          if (data) {
            const firstResult = data.results.find(({ type }) => type === "result")
            const firstComment = data.results.find(({ type }) => type === "comment")

            if (firstResult) {
              dispatch(openTestResults([firstResult.id]))
            }

            if (firstComment) {
              dispatch(openComment([firstComment.id]))
            }
          }
        } catch (error) {
          console.error(error)
        }
      },
    }),
  }),
})

export const testRelatedEntitiesInvalidate = testApi.util.invalidateTags([
  { type: "TestRelatedEntities" },
])

export const {
  useGetTestQuery,
  useLazyGetTestsQuery,
  useLazyGetTestQuery,
  useUpdateTestMutation,
  useBulkUpdateMutation,
  useGetTestsQuery,
  useGetRelatedEntitiesQuery,
} = testApi
