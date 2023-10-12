import { Breadcrumb, Layout, PageHeader, Space } from "antd"
import { CreateProject } from "features/project"
import { useContext, useEffect } from "react"
import { MenuContext } from "widgets"

import { ProjectsTable } from "entities/project/ui"

import { MenuContextType } from "widgets/[ui]/main"

const { Content } = Layout

export const ProjectsMain = () => {
  const { setActiveMenu, setOpenSubMenu } = useContext(MenuContext) as MenuContextType

  useEffect(() => {
    setOpenSubMenu(["administration"])
    setActiveMenu(["administration.projects"])
  }, [])

  const breadcrumbItems = [
    <Breadcrumb.Item key="administration">Administration</Breadcrumb.Item>,
    <Breadcrumb.Item key="projects">Projects</Breadcrumb.Item>,
  ]

  return (
    <>
      <PageHeader
        breadcrumbRender={() => <Breadcrumb>{breadcrumbItems}</Breadcrumb>}
        title="Projects"
      />
      <Content style={{ margin: "24px" }}>
        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
          <Space style={{ marginBottom: "16px", display: "flex", justifyContent: "right" }}>
            <CreateProject />
          </Space>
          <ProjectsTable />
        </div>
      </Content>
    </>
  )
}
