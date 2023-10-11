import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

export const attachmentApi = createApi({
  reducerPath: "attachmentApi",
  baseQuery: baseQueryWithLogout,
  endpoints: (builder) => ({
    createAttachment: builder.mutation<IAttachment[], FormData>({
      query: (body) => ({
        url: "v1/attachments/",
        method: "POST",
        body,
      }),
    }),
  }),
})

export const { useCreateAttachmentMutation } = attachmentApi
