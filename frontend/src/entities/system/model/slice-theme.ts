import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"

const initialState: ThemeState = {
  themeType: "light",
  themeValue: "light",
}

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeType: (state, action: PayloadAction<ThemeType>) => {
      state.themeType = action.payload
    },
    setThemeValue: (state, action: PayloadAction<ThemeValue>) => {
      state.themeValue = action.payload
    },
  },
})

export const { setThemeType, setThemeValue } = themeSlice.actions

export const selectThemeValue = (state: RootState): ThemeValue => state.theme.themeValue
export const selectThemeType = (state: RootState): ThemeType => state.theme.themeType

export const themeReducer = themeSlice.reducer
