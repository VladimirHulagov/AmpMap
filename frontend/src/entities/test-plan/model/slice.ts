import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: TestPlanState = {
  showArchivedTests: false,
  showArchivedResults: false,
  tests: [],
}

export const testPlanSlice = createSlice({
  name: "testPlan",
  initialState,
  reducers: {
    setShowArchivedTests: (state, action: PayloadAction<boolean>) => {
      state.showArchivedTests = action.payload
    },
    showArchivedTests: (state) => {
      state.showArchivedTests = !state.showArchivedTests
    },
    showArchivedResults: (state) => {
      state.showArchivedResults = !state.showArchivedResults
    },
    setTests: (state, action: PayloadAction<Test[]>) => {
      state.tests = action.payload
    },
  },
})

export const { showArchivedTests, showArchivedResults, setTests, setShowArchivedTests } =
  testPlanSlice.actions

export const testPlanReducer = testPlanSlice.reducer

export const selectArchivedTestsIsShow = (state: RootState) => state.testPlan.showArchivedTests
export const selectArchivedResultsIsShow = (state: RootState) => state.testPlan.showArchivedResults
export const selectTests = (state: RootState) => state.testPlan.tests
