import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: ResultsState = {
  openedResults: [],
}

export const resultsSlice = createSlice({
  name: "results",
  initialState,
  reducers: {
    toggleResultVisibility: (state, action: PayloadAction<number>) => {
      if (state.openedResults.includes(action.payload)) {
        state.openedResults = state.openedResults.filter((id) => id !== action.payload)
        return
      }

      state.openedResults.push(action.payload)
    },
    openTestResults: (state, action: PayloadAction<number[]>) => {
      state.openedResults = [...new Set([...state.openedResults, ...action.payload])]
    },
    closeTestResults: (state, action: PayloadAction<number[]>) => {
      state.openedResults = state.openedResults.filter((id) => !action.payload.includes(id))
    },
  },
})

export const { toggleResultVisibility, openTestResults, closeTestResults } = resultsSlice.actions

export const selectOpenedResults = (state: RootState) => state.results.openedResults

export const resultsReducer = resultsSlice.reducer
