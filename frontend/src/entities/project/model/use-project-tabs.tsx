import React, { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"

import { ProjectActiveTabContext } from "pages/project/project-main"

export interface ProjectTabsProps {
  projectId: string
}

export interface Tab {
  key: string
  label: React.ReactNode
  path: string
}

export const useProjectTabs = (projectId: string) => {
  const navigate = useNavigate()
  const { projectActiveTab } = useContext(ProjectActiveTabContext)!

  const tabItems: Tab[] = [
    { label: "Overview", key: "overview", path: `/projects/${projectId}` },
    {
      label: "Test Suites & Cases",
      key: "suites",
      path: `/projects/${projectId}/suites`,
    },
    {
      label: "Test Plans & Results",
      key: "plans",
      path: `/projects/${projectId}/plans`,
    },
  ].map((tab: Tab) => {
    tab.label = <Link to={tab.path}>{tab.label}</Link>
    return tab
  })

  const onNavigate = (key: string) => {
    const activeTabItem = tabItems.find((i) => i.key === key)
    if (!activeTabItem) return
    navigate(activeTabItem.path)
  }

  const onChange = (key: string) => {
    onNavigate(key)
  }

  const onTabClick = (key: string) => {
    onNavigate(key)
  }

  return { projectActiveTab, tabItems, onTabClick, onChange }
}
