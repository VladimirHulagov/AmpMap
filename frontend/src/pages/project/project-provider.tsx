import React, { useContext } from "react"
import { Outlet, useParams } from "react-router-dom"

import { useGetProjectQuery } from "entities/project/api"

export interface ProjectContextType {
  project: Project
}

export const ProjectContext = React.createContext<ProjectContextType | null>(null)

export const ProjectProvider = () => {
  const { projectId } = useParams<ParamProjectId>()
  const { data: project } = useGetProjectQuery(Number(projectId), {
    skip: !projectId,
  })

  if (!project) return null

  return (
    <ProjectContext.Provider value={{ project }}>
      <Outlet context={projectId} />
    </ProjectContext.Provider>
  )
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProjectContext must be used within ProjectProvider")
  }
  return context.project
}
