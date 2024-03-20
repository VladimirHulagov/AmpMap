import { PageHeader } from "@ant-design/pro-layout"
import { Breadcrumb, Layout, Space } from "antd"
import { CreateProject } from "features/project"
import { useContext, useEffect } from "react"
import { MenuContext } from "widgets"

import { ProjectsTable } from "widgets/project/ui/projects-table"

const { Content } = Layout

export const ProjectsMain = () => {
  const { setActiveMenu, setOpenSubMenu } = useContext(MenuContext)!

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
        style={{ paddingBottom: 0 }}
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
