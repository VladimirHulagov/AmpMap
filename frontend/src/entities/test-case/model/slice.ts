import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: TestCaseState = {
  drawerTestCase: null,
  modal: {
    isShow: false,
    isEditMode: false,
  },
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
    showCreateModal: (state) => {
      state.modal.isShow = true
    },
    showEditModal: (state) => {
      state.modal = {
        isShow: true,
        isEditMode: true,
      }
    },
    hideModal: (state) => {
      state.modal = {
        isShow: false,
        isEditMode: false,
      }
    },
  },
})

export const {
  setDrawerTestCase,
  clearDrawerTestCase,
  showCreateModal,
  showEditModal,
  hideModal,
  setDrawerTestCaseIsArchive,
} = testCaseSlice.actions

export const testCaseReducer = testCaseSlice.reducer

export const selectDrawerTestCase = (state: RootState) => state.testCase.drawerTestCase
export const selectModalIsShow = (state: RootState) => state.testCase.modal.isShow
export const selectModalIsEditMode = (state: RootState) => state.testCase.modal.isEditMode
