import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { systemStatsInvalidate } from "entities/system/api"

const rootPath = "v1/suites"

export const suiteApi = createApi({
  reducerPath: "suiteApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["TestSuite", "TestSuiteDeletePreview"],
  endpoints: (builder) => ({
    getTestSuites: builder.query<PaginationResponse<Suite[]>, GetTestSuitesTreeViewQuery>({
      query: ({ project, parent, search, ...params }) => ({
        url: `${rootPath}/`,
        params: { project, parent, search, ...params },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "TestSuite" as const,
                id,
              })),
              { type: "TestSuite", id: "LIST" },
            ]
          : [{ type: "TestSuite", id: "LIST" }],
    }),
    getTestSuitesTreeView: builder.query<PaginationResponse<Suite[]>, GetTestSuitesTreeViewQuery>({
      query: ({ project, treeview = true, parent, search, ...params }) => ({
        url: `${rootPath}/`,
        params: { project, treeview, parent, search, ...params },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "TestSuite" as const,
                id,
              })),
              { type: "TestSuite", id: "LIST" },
            ]
          : [{ type: "TestSuite", id: "LIST" }],
    }),
    getTestSuitesTreeViewWithCases: builder.query<
      PaginationResponse<SuiteWithCases[]>,
      GetTestSuitesTreeViewQuery
    >({
      query: ({ project, treeview = true, show_cases = true, parent, ...params }) => ({
        url: `${rootPath}/`,
        params: { project, treeview, parent, show_cases, ...params },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "TestSuite" as const,
                id,
              })),
              { type: "TestSuite", id: "LIST" },
            ]
          : [{ type: "TestSuite", id: "LIST" }],
    }),
    createSuite: builder.mutation<Suite, SuiteCreate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: (result) =>
        result?.parent
          ? [
              { type: "TestSuite", id: "LIST" },
              { type: "TestSuiteDeletePreview", id: result?.parent.id },
            ]
          : [
              { type: "TestSuite", id: "LIST" },
              { type: "TestSuiteDeletePreview", id: "LIST" },
            ],
    }),
    updateTestSuite: builder.mutation<Suite, { id: Id; body: SuiteUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "TestSuite", id },
              { type: "TestSuite", id: "LIST" },
            ]
          : [{ type: "TestSuite", id: "LIST" }],
    }),
    deleteTestSuite: builder.mutation<void, number>({
      query: (testSuiteId) => ({
        url: `${rootPath}/${testSuiteId}/`,
        method: "DELETE",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(systemStatsInvalidate)
      },
      invalidatesTags: (result, error, id) =>
        result
          ? [
              { type: "TestSuite", id },
              { type: "TestSuite", id: "LIST" },
            ]
          : [{ type: "TestSuite", id: "LIST" }],
    }),
    getSuite: builder.query<Suite, GetTestSuiteQuery>({
      query: ({ suiteId, treeview = false }) => ({
        url: `${rootPath}/${suiteId}/`,
        method: "GET",
        params: { treeview },
      }),
      providesTags: (result, error, suite) => [{ type: "TestSuite", id: suite.suiteId }],
    }),
    getSuiteParents: builder.query<SuiteParents, string>({
      query: (suiteId) => `${rootPath}/${suiteId}/parents/`,
      providesTags: (result, error, id) => [{ type: "TestSuite", id }],
    }),
    getSuiteDeletePreview: builder.query<DeletePreviewResponse[], string>({
      query: (id) => ({
        url: `${rootPath}/${id}/delete/preview/`,
      }),
      providesTags: (result, error, id) => [
        { type: "TestSuiteDeletePreview", id },
        { type: "TestSuiteDeletePreview", id: "LIST" },
      ],
    }),
    copySuite: builder.mutation<CopySuiteResponse[], SuiteCopyBody>({
      query: (body) => ({
        url: `${rootPath}/copy/`,
        method: "POST",
        body,
      }),
    }),
  }),
})

export const suiteInvalidate = suiteApi.util.invalidateTags([
  { type: "TestSuite", id: "LIST" },
  { type: "TestSuiteDeletePreview", id: "LIST" },
])

export const {
  useGetTestSuitesQuery,
  useLazyGetTestSuitesQuery,
  useGetSuiteQuery,
  useLazyGetTestSuitesTreeViewQuery,
  useCreateSuiteMutation,
  useDeleteTestSuiteMutation,
  useGetTestSuitesTreeViewQuery,
  useUpdateTestSuiteMutation,
  useLazyGetSuiteQuery,
  useGetSuiteParentsQuery,
  useLazyGetTestSuitesTreeViewWithCasesQuery,
  useGetSuiteDeletePreviewQuery,
  useCopySuiteMutation,
} = suiteApi
