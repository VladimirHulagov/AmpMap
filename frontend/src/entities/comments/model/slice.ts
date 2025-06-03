import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: CommentState = {
  openedComments: [],
}

export const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    toggleCommentVisibility: (state, action: PayloadAction<number>) => {
      if (state.openedComments.includes(action.payload)) {
        state.openedComments = state.openedComments.filter((id) => id !== action.payload)
        return
      }

      state.openedComments.push(action.payload)
    },
    openComment: (state, action: PayloadAction<number[]>) => {
      state.openedComments = [...new Set([...state.openedComments, ...action.payload])]
    },
    closeComment: (state, action: PayloadAction<number[]>) => {
      state.openedComments = state.openedComments.filter((id) => !action.payload.includes(id))
    },
  },
})

export const { toggleCommentVisibility, openComment, closeComment } = commentsSlice.actions

export const selectOpenedComments = (state: RootState) => state.comments.openedComments

export const commentsReducer = commentsSlice.reducer
