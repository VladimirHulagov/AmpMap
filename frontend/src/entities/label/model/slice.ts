import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: LabelState = {
  modal: {
    isShow: false,
    mode: "edit",
    label: undefined,
  },
  selectedLabels: { labels: [], not_labels: [] },
}

export const labelSlice = createSlice({
  name: "label",
  initialState,
  reducers: {
    showLabelModal: (state, action: PayloadAction<{ mode: ModalMode; label?: Label }>) => {
      state.modal.isShow = true
      state.modal.mode = action.payload.mode
      state.modal.label = action.payload.label
    },
    hideModal: (state) => {
      state.modal.isShow = false
      state.modal.label = undefined
    },
    setSelectedLabels: (state, action: PayloadAction<LabelState["selectedLabels"]>) => {
      state.selectedLabels = action.payload
    },
  },
})

export const { setSelectedLabels, showLabelModal, hideModal } = labelSlice.actions

export const labelReducer = labelSlice.reducer

export const selectModal = (state: RootState) => state.label.modal
export const selectSelectedLabels = (state: RootState) => state.label.selectedLabels
