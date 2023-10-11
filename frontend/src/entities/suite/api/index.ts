import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

const rootPath = "v1/suites"

export const suiteApi = createApi({
  reducerPath: "suiteApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["TestSuite"],
  endpoints: (builder) => ({
    getTestSuites: builder.query<PaginationResponse<ISuite[]>, IGetTestSuitesTreeViewQuery>({
      query: ({ project, parent, search, ...params }) => ({
        url: rootPath,
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
    getTestSuitesTreeView: builder.query<PaginationResponse<ISuite[]>, IGetTestSuitesTreeViewQuery>(
      {
        query: ({ project, treeview = true, parent, search, ...params }) => ({
          url: rootPath,
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
      }
    ),
    getTestSuitesTreeViewWithCases: builder.query<
      PaginationResponse<ISuiteWithCases[]>,
      IGetTestSuitesTreeViewQuery
    >({
      query: ({ project, treeview = true, show_cases = true, parent, ...params }) => ({
        url: rootPath,
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
    createSuite: builder.mutation<ISuite, ISuiteCreate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "TestSuite", id: "LIST" }],
    }),
    updateTestSuite: builder.mutation<ISuite, { id: Id; body: ISuiteUpdate }>({
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
      invalidatesTags: (result, error, id) =>
        result
          ? [
              { type: "TestSuite", id },
              { type: "TestSuite", id: "LIST" },
            ]
          : [{ type: "TestSuite", id: "LIST" }],
    }),
    getSuite: builder.query<ISuite, IGetTestSuiteQuery>({
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
        url: `${rootPath}/${id}/delete/preview`,
      }),
    }),
    copySuite: builder.mutation<void, SuiteCopyBody>({
      query: (body) => ({
        url: `${rootPath}/copy/`,
        method: "POST",
        body,
      }),
    }),
  }),
})

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
  useLazyGetSuiteParentsQuery,
  useGetTestSuitesTreeViewWithCasesQuery,
  useLazyGetTestSuitesTreeViewWithCasesQuery,
  useGetSuiteDeletePreviewQuery,
  useCopySuiteMutation,
} = suiteApi
