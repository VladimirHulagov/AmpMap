import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { setUser } from "entities/auth/model"

import { setUserConfig } from "../model"

const rootPath = "v1/users"

export const usersApi = createApi({
  reducerPath: "usersApi",
  tagTypes: ["User", "Profile", "Config"],
  baseQuery: baseQueryWithLogout,
  endpoints: (builder) => ({
    getConfig: builder.query<IUserConfig, void>({
      query: () => `${rootPath}/me/config/`,
      providesTags: () => ["Config"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUserConfig(data))
        } catch (error) {
          console.error(error)
        }
      },
    }),
    updateConfig: builder.mutation<void, IUserConfig>({
      query: (body) => ({
        url: `${rootPath}/me/config/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Config"],
    }),
    getUsers: builder.query<IUser[], void>({
      query: () => rootPath,
      providesTags: () => [{ type: "User", id: "LIST" }],
    }),
    getMe: builder.query<IUser, void>({
      query: () => `${rootPath}/me/`,
      providesTags: () => [{ type: "Profile" }],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data))
        } catch (error) {
          console.error(error)
        }
      },
    }),
    updateMe: builder.mutation<void, IUserUpdate>({
      query: (body) => ({
        url: `${rootPath}/me/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Profile" }],
    }),
    createUser: builder.mutation<IUser, IUserCreate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation<IUser, { id: Id; body: IUserUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, _, { id }) =>
        result
          ? [
              { type: "User", id },
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `${rootPath}/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    uploadAvatar: builder.mutation<IAttachment[], FormData>({
      query: (body) => ({
        url: `${rootPath}/me/avatar/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Profile" }],
    }),
    deleteAvatar: builder.mutation<void, void>({
      query: () => ({
        url: `${rootPath}/me/avatar/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Profile" }],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetConfigQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLazyGetConfigQuery,
  useUpdateMeMutation,
  useUpdateConfigMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} = usersApi
