import { PlusOutlined } from "@ant-design/icons"
import { Breadcrumb, Button, Layout, PageHeader, Space } from "antd"
import React, { useContext, useEffect } from "react"
import { useDispatch } from "react-redux"
import { MenuContext } from "widgets"

import { showCreateProjectModal } from "entities/project/model"
import { CreateEditProjectModal, ProjectsTable } from "entities/project/ui"

import { MenuContextType } from "widgets/[ui]/main"

const { Content } = Layout

export const ProjectsMain = () => {
  const dispatch = useDispatch()
  const { setActiveMenu, setOpenSubMenu } = useContext(MenuContext) as MenuContextType

  useEffect(() => {
    setOpenSubMenu(["administration"])
    setActiveMenu(["administration.projects"])
  }, [])

  const breadcrumbItems = [
    <Breadcrumb.Item key="administration">Administration</Breadcrumb.Item>,
    <Breadcrumb.Item key="projects">Projects</Breadcrumb.Item>,
  ]

  const handleClick = () => {
    dispatch(showCreateProjectModal())
  }

  return (
    <>
      <PageHeader
        breadcrumbRender={() => <Breadcrumb>{breadcrumbItems}</Breadcrumb>}
        title="Projects"
      />
      <Content style={{ margin: "24px" }}>
        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
          <Space style={{ marginBottom: "16px", display: "flex", justifyContent: "right" }}>
            <Button
              id="create-project"
              icon={<PlusOutlined />}
              type="primary"
              onClick={handleClick}
            >
              Create Project
            </Button>
            <CreateEditProjectModal />
          </Space>
          <ProjectsTable />
        </div>
      </Content>
    </>
  )
}
