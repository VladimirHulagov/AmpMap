import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: TestCaseState = {
  testCase: null,
  modal: {
    isShow: false,
    isEditMode: false,
  },
}

export const testCaseSlice = createSlice({
  name: "testCase",
  initialState,
  reducers: {
    setTestCase: (state, action: PayloadAction<TestCase>) => {
      state.testCase = action.payload
    },
    clearTestCase: (state) => {
      state.testCase = null
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

export const { setTestCase, clearTestCase, showCreateModal, showEditModal, hideModal } =
  testCaseSlice.actions

export const testCaseReducer = testCaseSlice.reducer

export const selectTestCase = (state: RootState) => state.testCase.testCase
export const selectModalIsShow = (state: RootState) => state.testCase.modal.isShow
export const selectModalIsEditMode = (state: RootState) => state.testCase.modal.isEditMode
