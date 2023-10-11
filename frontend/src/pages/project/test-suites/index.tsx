import { useContext, useEffect } from "react"
import { Outlet } from "react-router-dom"

import { ProjectActiveTabContext, ProjectActiveTabContextType } from "pages/project/project-main"

export const ProjectTestSuitesPage = () => {
  const { setProjectActiveTab } = useContext(ProjectActiveTabContext) as ProjectActiveTabContextType
  useEffect(() => {
    setProjectActiveTab("suites")
  })

  return <Outlet />
}
