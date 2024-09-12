import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { labelInvalidate } from "entities/label/api"

import { systemStatsInvalidate } from "entities/system/api"

import { testApi } from "entities/test/api"

import { invalidatesList, providesList } from "shared/libs"

const rootPath = "v1/testplans"

export const testPlanApi = createApi({
  reducerPath: "testPlanApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: [
    "TestPlan",
    "TestPlanStatistics",
    "TestPlanLabels",
    "TestPlanCasesIds",
    "TestPlanHistogram",
    "TestPlanStatuses",
  ],
  endpoints: (builder) => ({
    getTestPlans: builder.query<PaginationResponse<TestPlan[]>, QueryWithPagination<TestPlanQuery>>(
      {
        query: ({ projectId, search, ...params }) => ({
          url: `${rootPath}/`,
          params: {
            project: projectId,
            treeview: false,
            search,
            ...params,
          },
        }),
        providesTags: (result) =>
          result
            ? [
                ...result.results.map(({ id }) => ({
                  type: "TestPlan" as const,
                  id,
                })),
                { type: "TestPlan", id: "LIST" },
              ]
            : [{ type: "TestPlan", id: "LIST" }],
      }
    ),
    getTestPlansTreeView: builder.query<
      PaginationResponse<TestPlanTreeView[]>,
      QueryWithPagination<TestPlanQuery>
    >({
      query: ({ projectId, search, ...params }) => ({
        url: `${rootPath}/`,
        params: { project: projectId, treeview: true, search, ...params },
      }),
      providesTags: (result) => providesList(result?.results, "TestPlan"),
    }),
    getTestPlan: builder.query<TestPlan, TestPlanQueryParams>({
      query: ({ testPlanId, ...params }) => ({
        url: `${rootPath}/${testPlanId}/`,
        params,
      }),
      providesTags: (result, error, { testPlanId }) => [{ type: "TestPlan", id: testPlanId }],
    }),
    getTestPlanActivity: builder.query<
      PaginationResponse<Record<string, TestPlanActivityResult[]>>,
      TestPlanActivityParams
    >({
      query: ({ testPlanId, ...params }) => ({
        url: `${rootPath}/${testPlanId}/activity/`,
        params,
      }),
      providesTags: (result, error, { testPlanId: id }) => [{ type: "TestPlan", id }],
    }),
    deleteTestPlan: builder.mutation<void, number>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/`,
        method: "DELETE",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: [{ type: "TestPlan", id: "LIST" }],
    }),
    archiveTestPlan: builder.mutation<void, number>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/archive/`,
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: (result, error, id) => [
        { type: "TestPlan", id: "LIST" },
        { type: "TestPlan", id },
      ],
    }),
    createTestPlan: builder.mutation<TestPlan[], TestPlanCreate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: (result) => invalidatesList(result?.[0], "TestPlan"),
    }),
    updateTestPlan: builder.mutation<TestPlan, { id: Id; body: TestPlanUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanStatistics", id }]))
        dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanHistogram", id }]))
        dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanLabels", id: "LIST" }]))
        dispatch(testPlanApi.util.invalidateTags([{ type: "TestPlanCasesIds", id }]))
        dispatch(testApi.util.invalidateTags([{ type: "Test", id: "LIST" }]))
        dispatch(labelInvalidate)
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: (result) => invalidatesList(result, "TestPlan"),
    }),
    getTestPlanStatistics: builder.query<TestPlanStatistics[], TestPlanStatisticsParams>({
      query: ({ testPlanId, ...params }) => ({
        url: `${rootPath}/${testPlanId}/statistics/`,
        params,
      }),
      providesTags: (result, error, { testPlanId }) => [
        { type: "TestPlanStatistics", id: testPlanId },
      ],
    }),
    getTestPlanHistogram: builder.query<TestPlanHistogramData[], TestPlanHistogramParams>({
      query: ({ testPlanId, ...params }) => ({
        url: `${rootPath}/${testPlanId}/histogram/`,
        params,
      }),
      providesTags: (result, error, { testPlanId }) => [
        { type: "TestPlanHistogram", id: testPlanId },
      ],
    }),
    getTestPlanLabels: builder.query<Label[], string>({
      query: (testPlanId) => `${rootPath}/${testPlanId}/labels/`,
      providesTags: () => [{ type: "TestPlanLabels", id: "LIST" }],
    }),
    getTestPlanSuites: builder.query<TestPlanSuite[], string>({
      query: (testPlanId) => `${rootPath}/${testPlanId}/suites/`,
    }),
    getTestPlanCases: builder.query<{ case_ids: string[] }, TestPlanCasesParams>({
      query: ({ testPlanId, include_children = false }) => ({
        url: `${rootPath}/${testPlanId}/cases`,
        params: {
          include_children,
        },
      }),
      providesTags: (result, error, { testPlanId }) => [
        { type: "TestPlanCasesIds", id: testPlanId },
      ],
    }),
    getTestPlanDeletePreview: builder.query<DeletePreviewResponse[], string>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/delete/preview/`,
      }),
      providesTags: (result, error, id) => [{ type: "TestPlan", id }],
    }),
    getTestPlanArchivePreview: builder.query<DeletePreviewResponse[], string>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/archive/preview/`,
      }),
      providesTags: (result, error, id) => [{ type: "TestPlan", id }],
    }),
    сopyTestPlan: builder.mutation<TestPlan[], TestPlanCopyBody>({
      query: (body) => ({
        url: `${rootPath}/copy/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: [{ type: "TestPlan", id: "LIST" }],
    }),
    getTestPlanStatuses: builder.query<Status[], string | number>({
      query: (testPlanId) => `${rootPath}/${testPlanId}/statuses/`,
      providesTags: (result, error, id) => [{ type: "TestPlanStatuses", id }],
    }),
    getTestPlanActivityStatuses: builder.query<Status[], string | number>({
      query: (testPlanId) => `${rootPath}/${testPlanId}/activity/statuses/`,
      providesTags: (result, error, id) => [{ type: "TestPlanStatuses", id }],
    }),
  }),
})

export const testPlanInvalidate = testPlanApi.util.invalidateTags([
  { type: "TestPlanLabels", id: "LIST" },
])

export const testPlanStatusesInvalidate = (id: string | number) =>
  testPlanApi.util.invalidateTags([{ type: "TestPlanStatuses", id }])

export const {
  useGetTestPlanQuery,
  useLazyGetTestPlansQuery,
  useGetTestPlansTreeViewQuery,
  useLazyGetTestPlansTreeViewQuery,
  useCreateTestPlanMutation,
  useGetTestPlansQuery,
  useDeleteTestPlanMutation,
  useGetTestPlanStatisticsQuery,
  useUpdateTestPlanMutation,
  useGetTestPlanSuitesQuery,
  useGetTestPlanLabelsQuery,
  useLazyGetTestPlanActivityQuery,
  useGetTestPlanCasesQuery,
  useGetTestPlanDeletePreviewQuery,
  useGetTestPlanArchivePreviewQuery,
  useArchiveTestPlanMutation,
  useGetTestPlanHistogramQuery,
  useСopyTestPlanMutation,
  useLazyGetTestPlanStatusesQuery,
  useLazyGetTestPlanActivityStatusesQuery,
} = testPlanApi
