import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { MenuContext } from "widgets"

import { useBreadcrumbs } from "shared/hooks"

import { MenuContextType } from "widgets/[ui]/main"

export const useProjectMain = () => {
  const { setActiveMenu } = useContext(MenuContext) as unknown as MenuContextType
  const [projectActiveTab, setProjectActiveTab] = useState("")
  const { projectId } = useParams<ParamProjectId>()
  const { isLoadingProject, project, breadCrumbs } = useBreadcrumbs()

  useEffect(() => {
    setActiveMenu(["dashboard"])
  }, [])

  return {
    projectActiveTab,
    setProjectActiveTab,
    projectId,
    isLoadingProject,
    project,
    breadCrumbs,
  }
}
