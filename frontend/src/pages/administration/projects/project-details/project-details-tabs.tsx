import { Tabs } from "antd"
import React, { useContext } from "react"
import { useNavigate } from "react-router-dom"

import {
  ProjectDetailsActiveTabContext,
  ProjectDetailsActiveTabContextType,
} from "./project-details-main"

interface ProjectDetailsTabsProps {
  projectId: string
}

const ProjectDetailsTabs = ({ projectId }: ProjectDetailsTabsProps) => {
  const navigate = useNavigate()
  const { projectDetailsActiveTab } = useContext(
    ProjectDetailsActiveTabContext
  ) as ProjectDetailsActiveTabContextType

  const tabItems = [
    { label: "Overview", key: "overview", path: `/administration/projects/${projectId}/overview` },
    {
      label: "Parameters",
      key: "parameters",
      path: `/administration/projects/${projectId}/parameters`,
    },
    {
      label: "Labels",
      key: "labels",
      path: `/administration/projects/${projectId}/labels`,
    },
  ]

  const onChange = (key: string) => {
    const activeTabItem = tabItems.find((i) => i.key === key)
    if (!activeTabItem) return
    navigate(activeTabItem.path)
  }

  return <Tabs activeKey={projectDetailsActiveTab} items={tabItems} onChange={onChange} />
}

export default ProjectDetailsTabs
