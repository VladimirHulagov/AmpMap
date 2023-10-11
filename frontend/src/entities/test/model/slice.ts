import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: TestState = {
  test: null,
  settings: {
    table: {
      testPlanId: null,
      filters: {},
      pagination: {
        current: 1,
        defaultPageSize: 10,
        pageSizeOptions: ["10", "20", "50", "100"],
        showLessItems: true,
        hideOnSinglePage: false,
        showSizeChanger: true,
      },
      nonce: 0,
    },
  },
}

export const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    setTest: (state, action: PayloadAction<Test | null>) => {
      state.test = action.payload
    },
    setTableParams: (state, action: PayloadAction<TestTableParams>) => {
      state.settings.table = {
        ...state.settings.table,
        sorter: action.payload.sorter,
        pagination: {
          ...state.settings.table.pagination,
          ...action.payload.pagination,
        },
        filters: {
          ...state.settings.table.filters,
          ...action.payload.filters,
        },
        testPlanId: action.payload?.testPlanId || null,
      }
    },
    setInitialTableParams: (state) => {
      state.settings.table = initialState.settings.table
    },
    incrementNonce: (state) => {
      if (typeof state.settings.table.nonce === "undefined") {
        state.settings.table.nonce = 0
      } else {
        state.settings.table.nonce++
      }
    },
  },
})

export const { setTest, setTableParams, setInitialTableParams, incrementNonce } = testSlice.actions

export const selectTest = (state: RootState) => state.test.test
export const selectTableParams = (state: RootState) => state.test.settings.table

export const testReducer = testSlice.reducer
