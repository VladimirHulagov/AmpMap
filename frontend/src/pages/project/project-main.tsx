import React from "react"

export interface ProjectActiveTabContextType {
  projectActiveTab: string
  setProjectActiveTab: React.Dispatch<React.SetStateAction<string>>
}

export const ProjectActiveTabContext = React.createContext<ProjectActiveTabContextType | null>(null)
