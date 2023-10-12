import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

const rootPath = "v1/projects"

export const projectApi = createApi({
  reducerPath: "projectApi",
  tagTypes: ["Project"],
  baseQuery: baseQueryWithLogout,
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], boolean>({
      query: (showArchive) => ({
        url: rootPath,
        params: { is_archive: showArchive },
      }),
      providesTags: () => [{ type: "Project", id: "LIST" }],
    }),
    getProject: builder.query<Project, number>({
      query: (projectId) => `${rootPath}/${projectId}/`,
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation<Project, FormData>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),
    updateProject: builder.mutation<Project, { id: Id; body: FormData }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) =>
        result
          ? [
              { type: "Project", id },
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),
    deleteProject: builder.mutation<void, number>({
      query: (id) => ({
        url: `${rootPath}/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),
    archiveProject: builder.mutation<void, number>({
      query: (id) => ({
        url: `${rootPath}/${id}/archive/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) =>
        result
          ? [
              { type: "Project", id },
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),
    getProjectDeletePreview: builder.query<DeletePreviewResponse[], string>({
      query: (id) => ({
        url: `${rootPath}/${id}/delete/preview`,
      }),
    }),
    getProjectArchivePreview: builder.query<DeletePreviewResponse[], string>({
      query: (id) => ({
        url: `${rootPath}/${id}/archive/preview`,
      }),
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),
    getProjectProgress: builder.query<ProjectsProgress[], ProjectProgressParams>({
      query: ({ projectId, period_date_end, period_date_start }) => ({
        url: `v1/projects/${projectId}/progress`,
        method: "GET",
        params: { end_date: period_date_end, start_date: period_date_start },
      }),
      providesTags: (result, error, { projectId }) => [{ type: "Project", id: projectId }],
    }),
  }),
})

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useLazyGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectProgressQuery,
  useLazyGetProjectProgressQuery,
  useGetProjectDeletePreviewQuery,
  useArchiveProjectMutation,
  useGetProjectArchivePreviewQuery,
} = projectApi
