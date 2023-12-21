import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

const rootPath = "v1/comments"

export const commentsApi = createApi({
  reducerPath: "commentsApi",
  tagTypes: ["Comments"],
  baseQuery: baseQueryWithLogout,
  endpoints: (builder) => ({
    getComments: builder.query<
      PaginationResponse<CommentType[]>,
      QueryWithPagination<GetCommentsRequest>
    >({
      query: (params) => ({
        url: rootPath,
        params,
      }),
      providesTags: () => [{ type: "Comments", id: "LIST" }],
    }),
    getCommentById: builder.query<CommentType, string>({
      query: (commentId) => `${rootPath}/${commentId}/`,
      providesTags: (result, error, id) => [{ type: "Comments", id }],
    }),
    addComment: builder.mutation<CommentType, AddCommentsRequest>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Comments", id: "LIST" }],
    }),
    updateComment: builder.mutation<CommentType, UpdateCommentsRequest>({
      query: ({ comment_id, ...body }) => ({
        url: `${rootPath}/${comment_id}/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { comment_id }) =>
        result
          ? [
              { type: "Comments", id: comment_id },
              { type: "Comments", id: "LIST" },
            ]
          : [{ type: "Comments", id: "LIST" }],
    }),
    deleteComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `${rootPath}/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Comments", id: "LIST" }],
    }),
  }),
})

export const {
  useGetCommentsQuery,
  useLazyGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} = commentsApi
