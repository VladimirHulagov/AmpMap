import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: CustomAttributeState = {
  modal: {
    isShow: false,
    isEditMode: false,
  },
  attribute: undefined,
}

export const customAttributeSlice = createSlice({
  name: "customAttribute",
  initialState,
  reducers: {
    showCreateModal: (state) => {
      state.modal.isShow = true
    },
    showEditModal: (state, action: PayloadAction<{ attribute?: CustomAttribute }>) => {
      state.modal = {
        isShow: true,
        isEditMode: true,
      }
      state.attribute = action.payload.attribute
    },
    hideModal: (state) => {
      state.modal = {
        isShow: false,
        isEditMode: false,
      }
      state.attribute = undefined
    },
  },
})

export const { showCreateModal, showEditModal, hideModal } = customAttributeSlice.actions

export const customAttributeReducer = customAttributeSlice.reducer

export const selectModalIsShow = (state: RootState) => state.customAttribute.modal.isShow
export const selectModalIsEditMode = (state: RootState) => state.customAttribute.modal.isEditMode
export const selectAttribute = (state: RootState) => state.customAttribute.attribute
