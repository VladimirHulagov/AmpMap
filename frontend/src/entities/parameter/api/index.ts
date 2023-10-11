import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

export const parameterApi = createApi({
  reducerPath: "parameterApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Parameter"],
  endpoints: (builder) => ({
    getParameters: builder.query<IParameter[], Id>({
      query: (projectId) => ({
        url: "v1/parameters/",
        params: { project: projectId, treeview: true },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Parameter" as const,
                id,
              })),
              { type: "Parameter", id: "LIST" },
            ]
          : [{ type: "Parameter", id: "LIST" }],
    }),
    createParameter: builder.mutation<IParameter, IParameterUpdate>({
      query: (body) => ({
        url: "v1/parameters/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Parameter", id: "LIST" }],
    }),
    updateParameter: builder.mutation<IParameter, { id: Id; body: IParameterUpdate }>({
      query: ({ id, body }) => ({
        url: `v1/parameters/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "Parameter", id },
              { type: "Parameter", id: "LIST" },
            ]
          : [{ type: "Parameter", id: "LIST" }],
    }),
    deleteParameter: builder.mutation<void, Id>({
      query: (id) => ({
        url: `v1/parameters/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Parameter", id: "LIST" }],
    }),
  }),
})

export const {
  useGetParametersQuery,
  useCreateParameterMutation,
  useUpdateParameterMutation,
  useDeleteParameterMutation,
} = parameterApi
