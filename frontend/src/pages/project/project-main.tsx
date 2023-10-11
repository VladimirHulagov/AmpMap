import React from "react"

export type ProjectActiveTabContextType = {
  projectActiveTab: string
  setProjectActiveTab: React.Dispatch<React.SetStateAction<string>>
}

export const ProjectActiveTabContext = React.createContext<ProjectActiveTabContextType | null>(null)
