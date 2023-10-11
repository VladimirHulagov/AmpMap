import { useContext, useEffect } from "react"

import { ProjectOverview } from "entities/project/ui"

import { ProjectActiveTabContext, ProjectActiveTabContextType } from "pages/project/project-main"

export const ProjectOverviewTab = () => {
  const { setProjectActiveTab } = useContext(ProjectActiveTabContext) as ProjectActiveTabContextType
  useEffect(() => {
    setProjectActiveTab("overview")
  })
  return <ProjectOverview />
}
