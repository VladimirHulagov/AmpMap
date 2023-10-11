import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { labelApi } from "entities/label/api"

const rootPath = "v1/testplans"
const labelInvalidate = labelApi.util.invalidateTags([{ type: "Label", id: "LIST" }])

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
    getTestPlans: builder.query<
      PaginationResponse<ITestPlan[]>,
      QueryWithPagination<ITestPlanQuery>
    >({
      query: ({ projectId, showArchive, search, ...params }) => ({
        url: rootPath,
        params: { project: projectId, is_archive: showArchive, treeview: false, search, ...params },
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
    getTestPlansTreeView: builder.query<
      PaginationResponse<ITestPlanTreeView[]>,
      QueryWithPagination<ITestPlanQuery>
    >({
      query: ({ projectId, showArchive, search, ...params }) => ({
        url: rootPath,
        params: { project: projectId, is_archive: showArchive, treeview: true, search, ...params },
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
    getTestPlanTreeView: builder.query<ITestPlanTreeView, TestPlanTreeViewQueryParams>({
      query: ({ testPlanId, is_archive }) => ({
        url: `${rootPath}/${testPlanId}?treeview=true`,
        params: { is_archive },
      }),
      providesTags: (result, error, { testPlanId: id }) => [{ type: "TestPlan", id }],
    }),
    getTestPlan: builder.query<ITestPlan, number>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/`,
      }),
      providesTags: (result, error, id) => [{ type: "TestPlan", id }],
    }),
    getTestPlanActivity: builder.query<TestPlanActivity, TestPlanActivityParams>({
      query: ({ testPlanId, ...params }) => ({
        url: `${rootPath}/${testPlanId}/activity`,
        params,
      }),
      providesTags: (result, error, { testPlanId: id }) => [{ type: "TestPlan", id }],
    }),
    deleteTestPlan: builder.mutation<void, number>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "TestPlan", id: "LIST" }],
    }),
    archiveTestPlan: builder.mutation<void, number>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/archive/`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "TestPlan", id: "LIST" }],
    }),
    createTestPlan: builder.mutation<ITestPlan[], ITestPlanCreate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "TestPlan", id },
              { type: "TestPlan", id: "LIST" },
            ]
          : [{ type: "TestPlan", id: "LIST" }],
    }),
    updateTestPlan: builder.mutation<ITestPlan, { id: Id; body: ITestPlanUpdate }>({
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
      },
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "TestPlan", id },
              { type: "TestPlan", id: "LIST" },
            ]
          : [{ type: "TestPlan", id: "LIST" }],
    }),
    getTestPlanStatistics: builder.query<ITestPlanStatistics[], TestPlanStatisticsParams>({
      query: ({ testPlanId, ...params }) => ({
        url: `${rootPath}/${testPlanId}/statistics`,
        params,
      }),
      providesTags: (result, error, { testPlanId }) => [
        { type: "TestPlanStatistics", id: testPlanId },
      ],
    }),
    getTestPlanHistogram: builder.query<TestPlanHistogramData[], TestPlanHistogramParams>({
      query: ({ testPlanId, ...params }) => ({
        url: `${rootPath}/${testPlanId}/histogram`,
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
        url: `${rootPath}/${testPlanId}/delete/preview`,
      }),
      providesTags: (result, error, id) => [{ type: "TestPlan", id }],
    }),
    getTestPlanArchivePreview: builder.query<DeletePreviewResponse[], string>({
      query: (testPlanId) => ({
        url: `${rootPath}/${testPlanId}/archive/preview`,
      }),
      providesTags: (result, error, id) => [{ type: "TestPlan", id }],
    }),
  }),
})

export const {
  useLazyGetTestPlansQuery,
  useGetTestPlansTreeViewQuery,
  useLazyGetTestPlansTreeViewQuery,
  useCreateTestPlanMutation,
  useGetTestPlanQuery,
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
