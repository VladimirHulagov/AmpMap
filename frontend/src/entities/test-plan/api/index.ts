import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { labelInvalidate } from "entities/label/api"

import { systemStatsInvalidate } from "entities/system/api"

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
    }),
    getTestPlanTreeView: builder.query<TestPlanTreeView, TestPlanTreeViewQueryParams>({
      query: ({ testPlanId, is_archive }) => ({
        url: `${rootPath}/${testPlanId}?treeview=true`,
        params: { is_archive },
      }),
      providesTags: (result, error, { testPlanId: id }) => [{ type: "TestPlan", id }],
    }),
    getTestPlan: builder.query<TestPlan, number>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/`,
      }),
      providesTags: (result, error, id) => [{ type: "TestPlan", id }],
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
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "TestPlan", id },
              { type: "TestPlan", id: "LIST" },
            ]
          : [{ type: "TestPlan", id: "LIST" }],
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
        dispatch(labelInvalidate)
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "TestPlan", id },
              { type: "TestPlan", id: "LIST" },
            ]
          : [{ type: "TestPlan", id: "LIST" }],
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
    getTestPlanParents: builder.query<TestPlanParent, string>({
      query: (testPlanId) => `${rootPath}/${testPlanId}/parents/`,
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
  }),
})

export const testPlanInvalidate = testPlanApi.util.invalidateTags([
  { type: "TestPlanLabels", id: "LIST" },
])

export const {
  useLazyGetTestPlansQuery,
  useGetTestPlansTreeViewQuery,
  useLazyGetTestPlansTreeViewQuery,
  useCreateTestPlanMutation,
  useGetTestPlanQuery,
  useGetTestPlansQuery,
  useLazyGetTestPlanQuery,
  useDeleteTestPlanMutation,
  useGetTestPlanStatisticsQuery,
  useUpdateTestPlanMutation,
  useGetTestPlanTreeViewQuery,
  useGetTestPlanParentsQuery,
  useLazyGetTestPlanParentsQuery,
  useGetTestPlanSuitesQuery,
  useGetTestPlanLabelsQuery,
  useGetTestPlanActivityQuery,
  useLazyGetTestPlanActivityQuery,
  useGetTestPlanCasesQuery,
  useGetTestPlanDeletePreviewQuery,
  useGetTestPlanArchivePreviewQuery,
  useArchiveTestPlanMutation,
  useGetTestPlanHistogramQuery,
} = testPlanApi
