import { Tabs } from "antd"
import { useContext } from "react"
import { useNavigate } from "react-router-dom"

import { ProjectDetailsActiveTabContext } from "./project-details-main"

interface ProjectDetailsTabsProps {
  projectId: string
  showAccessManagement?: boolean
}

const ProjectDetailsTabs = ({
  projectId,
  showAccessManagement = true,
}: ProjectDetailsTabsProps) => {
  const navigate = useNavigate()
  const { projectDetailsActiveTab } = useContext(ProjectDetailsActiveTabContext)!

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
    {
      label: "Statuses",
      key: "statuses",
      path: `/administration/projects/${projectId}/statuses`,
    },
    {
      label: "Custom Attributes",
      key: "attributes",
      path: `/administration/projects/${projectId}/attributes`,
    },
    {
      label: "Settings",
      key: "settings",
      path: `/administration/projects/${projectId}/settings`,
    },
  ]

  if (showAccessManagement) {
    tabItems.push({
      label: "Access Management",
      key: "access-management",
      path: `/administration/projects/${projectId}/access-management`,
    })
  }

  const onChange = (key: string) => {
    const activeTabItem = tabItems.find((i) => i.key === key)
    if (!activeTabItem) return
    navigate(activeTabItem.path)
  }

  return <Tabs activeKey={projectDetailsActiveTab} items={tabItems} onChange={onChange} />
}

export default ProjectDetailsTabs
