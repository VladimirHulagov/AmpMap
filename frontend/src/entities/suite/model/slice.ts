import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: SuiteState = {
  testSuite: null,
}

export const suiteSlice = createSlice({
  name: "suite",
  initialState,
  reducers: {
    setTestSuite: (state, action: PayloadAction<ISuite>) => {
      state.testSuite = action.payload
    },
  },
})

export const { setTestSuite } = suiteSlice.actions

export const suiteReducer = suiteSlice.reducer

export const selectTestSuite = (state: RootState) => state.testSuite.testSuite
