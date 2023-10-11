import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

import { userConfig as baseUserConfig } from "shared/config/base-user-config"

const initialState: UserState = {
  user: null,
  userConfig: baseUserConfig,
  modal: {
    isShow: false,
    isEditMode: false,
  },
  modalProfile: {
    isShow: false,
  },
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
    setUserConfig: (state, action: PayloadAction<IUserConfig>) => {
      state.userConfig = action.payload
    },
    showCreateUserModal: (state) => {
      state.modal.isShow = true
    },
    showEditUserModal: (state) => {
      state.modal.isShow = true
      state.modal.isEditMode = true
    },
    hideModal: (state) => {
      state.modal.isShow = false
      state.modal.isEditMode = false
    },
    showEditProfileModal: (state) => {
      state.modalProfile.isShow = true
    },
    hideEditProfileModal: (state) => {
      state.modalProfile.isShow = false
    },
  },
})

export const {
  setUser,
  setUserConfig,
  showCreateUserModal,
  showEditUserModal,
  hideModal,
  showEditProfileModal,
  hideEditProfileModal,
} = userSlice.actions

export const selectModalIsShow = (state: RootState) => state.user.modal.isShow
export const selectModalIsEditMode = (state: RootState) => state.user.modal.isEditMode
export const selectUser = (state: RootState) => state.user.user
export const selectUserConfig = (state: RootState) => state.user.userConfig
export const selectProfileModalIsShow = (state: RootState) => state.user.modalProfile.isShow

export default userSlice.reducer
