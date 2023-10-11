import { Layout } from "antd"

import { ProjectCards } from "entities/project/ui/project-cards"

const { Content } = Layout

export const DashboardPageView = () => {
  return (
    <Content style={{ margin: "21px" }}>
      <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
        <ProjectCards />
      </div>
    </Content>
  )
}
