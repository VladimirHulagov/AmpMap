import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: TestCaseState = {
  drawerTestCase: null,
  editingTestCase: null,
}

export const testCaseSlice = createSlice({
  name: "testCase",
  initialState,
  reducers: {
    setDrawerTestCase: (state, action: PayloadAction<TestCase | null>) => {
      state.drawerTestCase = action.payload
    },
    setDrawerTestCaseIsArchive: (state, action: PayloadAction<boolean>) => {
      if (state.drawerTestCase) {
        state.drawerTestCase = { ...state.drawerTestCase, is_archive: action.payload }
      }
    },
    clearDrawerTestCase: (state) => {
      state.drawerTestCase = null
    },
    setEditingTestCase: (state, action: PayloadAction<TestCase | null>) => {
      state.editingTestCase = action.payload
    },
  },
})

export const {
  setDrawerTestCase,
  clearDrawerTestCase,
  setDrawerTestCaseIsArchive,
  setEditingTestCase,
} = testCaseSlice.actions

export const testCaseReducer = testCaseSlice.reducer

export const selectDrawerTestCase = (state: RootState) => state.testCase.drawerTestCase
export const selectEditingTestCase = (state: RootState) => state.testCase.editingTestCase
