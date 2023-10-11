import React from "react"

export { Main } from "./main"

export type MenuContextType = {
  activeMenu: string[]
  setActiveMenu: React.Dispatch<React.SetStateAction<string[]>>
  openSubMenu: string[]
  setOpenSubMenu: React.Dispatch<React.SetStateAction<string[]>>
}

export const MenuContext = React.createContext<MenuContextType | null>(null)
