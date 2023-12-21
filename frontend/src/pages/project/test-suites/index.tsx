import { useContext, useEffect } from "react"
import { Outlet } from "react-router-dom"

import { ProjectActiveTabContext } from "pages/project/project-main"

export const ProjectTestSuitesPage = () => {
  const { setProjectActiveTab } = useContext(ProjectActiveTabContext)!
  useEffect(() => {
    setProjectActiveTab("suites")
  })

  return <Outlet />
}
