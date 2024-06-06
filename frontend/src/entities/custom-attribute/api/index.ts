import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { customAttributeContentTypeNames } from "shared/config/custom-attribute-types"
import { invalidatesList, providesList } from "shared/libs"

const rootPath = "v1/custom-attributes"

export const customAttributeApi = createApi({
  reducerPath: "customAttributeApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["CustomAttribute"],
  endpoints: (builder) => ({
    getCustomAttributes: builder.query<CustomAttribute[], GetCustomAttributesParams>({
      query: ({ project }) => ({
        url: `${rootPath}/`,
        params: { project },
      }),
      providesTags: (result) => providesList(result, "CustomAttribute"),
    }),
    createCustomAttribute: builder.mutation<CustomAttribute, CustomAttributeUpdate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "CustomAttribute", id: "LIST" }],
    }),
    updateCustomAttribute: builder.mutation<
      CustomAttribute,
      { id: Id; body: CustomAttributeUpdate }
    >({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) => invalidatesList(result, "CustomAttribute"),
    }),
    deleteCustomAttribute: builder.mutation<void, Id>({
      query: (id) => ({
        url: `${rootPath}/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "CustomAttribute", id: "LIST" }],
    }),
    getCustomAttributeContentTypes: builder.query<CustomAttributeContentType[], void>({
      query: () => ({ url: `${rootPath}/content-types` }),
      transformResponse: (response: CustomAttributeContentTypesResponse) =>
        response?.map((type) => ({
          label: customAttributeContentTypeNames[type.model],
          value: type.id,
        })) ?? [],
    }),
  }),
})

export const {
  useGetCustomAttributesQuery,
  useCreateCustomAttributeMutation,
  useUpdateCustomAttributeMutation,
  useDeleteCustomAttributeMutation,
  useGetCustomAttributeContentTypesQuery,
} = customAttributeApi
