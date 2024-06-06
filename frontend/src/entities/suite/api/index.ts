import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { systemStatsInvalidate } from "entities/system/api"

import { invalidatesList, providesList } from "shared/libs"

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
      providesTags: (result) => providesList(result?.results, "TestSuite"),
    }),
    getTestSuitesTreeView: builder.query<
      PaginationResponse<SuiteTree[]>,
      GetTestSuitesTreeViewQuery
    >({
      query: ({ project, treeview = true, parent, search, ...params }) => ({
        url: `${rootPath}/`,
        params: { project, treeview, parent, search, ...params },
      }),
      providesTags: (result) => providesList(result?.results, "TestSuite"),
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
      invalidatesTags: (result) => invalidatesList(result, "TestSuite"),
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
      invalidatesTags: (result) => invalidatesList(result, "TestSuite"),
    }),
    getSuite: builder.query<Suite, number>({
      query: (suiteId) => `${rootPath}/${suiteId}/`,
      providesTags: (result, error, suiteId) => [{ type: "TestSuite", id: suiteId }],
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
  useLazyGetTestSuitesQuery,
  useGetSuiteQuery,
  useLazyGetTestSuitesTreeViewQuery,
  useCreateSuiteMutation,
  useDeleteTestSuiteMutation,
  useGetTestSuitesTreeViewQuery,
  useUpdateTestSuiteMutation,
  useGetSuiteDeletePreviewQuery,
  useCopySuiteMutation,
} = suiteApi
