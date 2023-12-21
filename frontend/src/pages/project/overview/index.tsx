import { useContext, useEffect } from "react"

import { ProjectOverview } from "entities/project/ui"

import { ProjectActiveTabContext } from "pages/project/project-main"

export const ProjectOverviewTab = () => {
  const { setProjectActiveTab } = useContext(ProjectActiveTabContext)!
  useEffect(() => {
    setProjectActiveTab("overview")
  })
  return <ProjectOverview />
}
