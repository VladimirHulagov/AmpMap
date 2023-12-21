import { Breadcrumb, Layout, PageHeader } from "antd"
import React, { useContext, useEffect, useState } from "react"
import { Link, Outlet, useParams } from "react-router-dom"
import { MenuContext } from "widgets"

import { useGetProjectQuery } from "entities/project/api"

import { ContainerLoader } from "shared/ui"

import ProjectDetailsTabs from "./project-details-tabs"

const { Content } = Layout

export interface ProjectDetailsActiveTabContextType {
  projectDetailsActiveTab: string
  setProjectDetailsActiveTab: React.Dispatch<React.SetStateAction<string>>
}

export const ProjectDetailsActiveTabContext =
  React.createContext<ProjectDetailsActiveTabContextType | null>(null)

export const ProjectDetailsMainPage = () => {
  const { setActiveMenu, setOpenSubMenu } = useContext(MenuContext)!
  const [projectDetailsActiveTab, setProjectDetailsActiveTab] = useState("")
  const { projectId } = useParams<ParamProjectId>()
  const { data: project, isLoading } = useGetProjectQuery(Number(projectId), { skip: !projectId })

  useEffect(() => {
    setOpenSubMenu(["administration"])
    setActiveMenu(["administration.projects"])
  }, [])

  if (isLoading || !projectId) {
    return <ContainerLoader />
  }

  const breadcrumbItems = [
    <Breadcrumb.Item key="administration">Administration</Breadcrumb.Item>,
    <Breadcrumb.Item key="projects">
      <Link to="/administration/projects">Projects</Link>
    </Breadcrumb.Item>,
    <Breadcrumb.Item key={projectId}>{project?.name}</Breadcrumb.Item>,
  ]

  return (
    <>
      <ProjectDetailsActiveTabContext.Provider
        value={{ projectDetailsActiveTab, setProjectDetailsActiveTab }}
      >
        <PageHeader
          breadcrumbRender={() => <Breadcrumb>{breadcrumbItems}</Breadcrumb>}
          title={project?.name}
          footer={<ProjectDetailsTabs projectId={projectId} />}
        />
        <Content style={{ margin: "24px" }}>
          <Outlet context={projectId} />
        </Content>
      </ProjectDetailsActiveTabContext.Provider>
    </>
  )
}
