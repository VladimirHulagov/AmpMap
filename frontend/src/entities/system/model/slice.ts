import { createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: SystemState = {
  messages: [],
  hiddenMessageIds: [],
}

export const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    addHiddenMessageId: (state, action) => {
      state.hiddenMessageIds = (state.hiddenMessageIds || []).concat(action.payload)
    },
  },
})

export const { setMessages, addHiddenMessageId } = systemSlice.actions

export const selectSystemMessages = (state: RootState) => state.system.messages
export const selectHiddenMessages = (state: RootState) => state.system.hiddenMessageIds

export const systemReducer = systemSlice.reducer
