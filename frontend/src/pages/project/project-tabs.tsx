import { Tabs } from "antd"

import { ProjectTabsProps, useProjectTabs } from "entities/project/model/use-project-tabs"

export const ProjectTabs = ({ projectId }: ProjectTabsProps) => {
  const { projectActiveTab, tabItems, onTabClick } = useProjectTabs(projectId)

  return (
    <Tabs
      activeKey={projectActiveTab}
      items={tabItems}
      onTabClick={onTabClick}
      style={{ marginBottom: 0 }}
    />
  )
}
