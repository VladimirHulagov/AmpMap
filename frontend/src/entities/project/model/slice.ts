import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: ProjectState = {
  projectId: null,
  project: null,
  modal: {
    isShow: false,
    isEditMode: false,
  },
  showArchived: false,
  isOnlyFavorites: false,
}

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProject: (state, action: PayloadAction<IProject>) => {
      state.project = action.payload
    },
    setProjectId: (state, action: PayloadAction<number>) => {
      state.projectId = action.payload
    },
    showCreateProjectModal: (state) => {
      state.modal.isShow = true
    },
    showEditProjectModal: (state) => {
      state.modal.isShow = true
      state.modal.isEditMode = true
    },
    hideModal: (state) => {
      state.modal.isShow = false
      state.modal.isEditMode = false
    },
    showArchived: (state) => {
      state.showArchived = !state.showArchived
    },
    setIsOnlyFavorites: (state) => {
      state.isOnlyFavorites = !state.isOnlyFavorites
    },
  },
})

export const {
  setProject,
  setProjectId,
  showCreateProjectModal,
  showEditProjectModal,
  hideModal,
  showArchived,
  setIsOnlyFavorites,
} = projectSlice.actions

export const selectModalIsShow = (state: RootState) => state.project.modal.isShow
export const selectModalIsEditMode = (state: RootState) => state.project.modal.isEditMode
export const selectProject = (state: RootState) => state.project.project
export const selectProjectId = (state: RootState) => state.project.projectId
export const selectArchivedIsShow = (state: RootState) => state.project.showArchived
export const selectIsOnlyFavorites = (state: RootState) => state.project.isOnlyFavorites

export const projectReducer = projectSlice.reducer
