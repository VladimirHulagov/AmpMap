import { Tabs } from "antd"

import { ProjectTabsProps, useProjectTabs } from "entities/project/model/use-project-tabs"

export const ProjectTabs = ({ projectId }: ProjectTabsProps) => {
  const { projectActiveTab, tabItems, onTabClick, onChange } = useProjectTabs(projectId)

  return (
    <Tabs
      activeKey={projectActiveTab}
      items={tabItems}
      onTabClick={onTabClick}
      onChange={onChange}
    />
  )
}
