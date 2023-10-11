import { createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: TestPlanState = {
  showArchivedTests: false,
  showArchivedResults: false,
}

export const testPlanSlice = createSlice({
  name: "testPlan",
  initialState,
  reducers: {
    showArchivedTests: (state) => {
      state.showArchivedTests = !state.showArchivedTests
    },
    showArchivedResults: (state) => {
      state.showArchivedResults = !state.showArchivedResults
    },
  },
})

export const { showArchivedTests, showArchivedResults } = testPlanSlice.actions

export const testPlanReducer = testPlanSlice.reducer

export const selectArchivedTestsIsShow = (state: RootState) => state.testPlan.showArchivedTests
export const selectArchivedResultsIsShow = (state: RootState) => state.testPlan.showArchivedResults
