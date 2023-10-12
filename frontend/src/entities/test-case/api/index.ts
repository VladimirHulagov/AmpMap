import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { labelApi } from "entities/label/api"

import { suiteApi } from "entities/suite/api"

import { testPlanApi } from "entities/test-plan/api"

const rootPath = "v1/cases"
const labelInvalidate = labelApi.util.invalidateTags([{ type: "Label", id: "LIST" }])
const testPlanInvalidate = testPlanApi.util.invalidateTags([{ type: "TestPlanLabels", id: "LIST" }])
const suiteInvalidate = suiteApi.util.invalidateTags([{ type: "TestSuite", id: "LIST" }])

export const testCaseApi = createApi({
  reducerPath: "testCaseApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["TestCase"],
  endpoints: (builder) => ({
    getTestCases: builder.query<PaginationResponse<TestCase[]>, GetTestCasesQuery>({
      query: (params) => ({
        url: rootPath,
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({
                type: "TestCase" as const,
                id,
              })),
              { type: "TestCase", id: "LIST" },
            ]
          : [{ type: "TestCase", id: "LIST" }],
    }),
    createTestCase: builder.mutation<TestCase, TestCaseCreate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(labelInvalidate)
        dispatch(testPlanInvalidate)
        dispatch(suiteInvalidate)
      },
      invalidatesTags: [{ type: "TestCase", id: "LIST" }],
    }),
    deleteTestCase: builder.mutation<void, number>({
      query: (testCaseId) => ({
        url: `${rootPath}/${testCaseId}/`,
        method: "DELETE",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(labelInvalidate)
        dispatch(testPlanInvalidate)
        dispatch(suiteInvalidate)
      },
      invalidatesTags: [{ type: "TestCase", id: "LIST" }],
    }),
    updateTestCase: builder.mutation<TestCase, TestCaseUpdate>({
      query: (body) => ({
        url: `${rootPath}/${body.id}/`,
        method: "PUT",
        body,
      }),
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled
          dispatch(labelInvalidate)
          dispatch(testPlanInvalidate)
          dispatch(suiteInvalidate)
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: (result, _, { id }) =>
        result
          ? [
              { type: "TestCase", id },
              { type: "TestCase", id: "LIST" },
            ]
          : [{ type: "TestCase", id: "LIST" }],
    }),
    getTestCaseById: builder.query<TestCase, number>({
      query: (testCaseId) => ({
        url: `${rootPath}/${testCaseId}/`,
      }),
      providesTags: (_, __, id) => [{ type: "TestCase", id }],
    }),
    getTestCaseByVersion: builder.query<TestCase, { testCaseId: number; version: string }>({
      query: ({ testCaseId, version }) => ({
        url: `${rootPath}/${testCaseId}?version=${version}`,
      }),
      providesTags: (_, __, data) => [{ type: "TestCase", id: data.testCaseId }],
    }),
    getTestCaseDeletePreview: builder.query<DeletePreviewResponse[], string>({
      query: (id) => ({
        url: `${rootPath}/${id}/delete/preview`,
      }),
    }),
    copyTestCase: builder.mutation<void, TestCaseCopyBody>({
      query: (body) => ({
        url: `${rootPath}/copy/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(labelInvalidate)
        dispatch(testPlanInvalidate)
        dispatch(suiteInvalidate)
      },
      invalidatesTags: [{ type: "TestCase", id: "LIST" }],
    }),
  }),
})

export const {
  useGetTestCasesQuery,
  useGetTestCaseByIdQuery,
  useCreateTestCaseMutation,
  useUpdateTestCaseMutation,
  useDeleteTestCaseMutation,
  useGetTestCaseByVersionQuery,
  useLazyGetTestCaseByVersionQuery,
  useGetTestCaseDeletePreviewQuery,
  useCopyTestCaseMutation,
} = testCaseApi
