import { Breadcrumb, Layout, PageHeader, Tag } from "antd"
import { Outlet } from "react-router-dom"

import { useProjectMain } from "entities/project/model/use-project-main"
import { ProjectIcon } from "entities/project/ui"

import { ProjectActiveTabContext } from "pages/project/project-main"

import { colors } from "shared/config"
import { ContainerLoader } from "shared/ui"

import { ProjectTabs } from "./project-tabs"

const { Content } = Layout

export const ProjectMainPage = () => {
  const {
    projectActiveTab,
    setProjectActiveTab,
    projectId,
    isLoadingProject,
    project,
    breadCrumbs,
  } = useProjectMain()

  if (isLoadingProject || !projectId) return <ContainerLoader />

  if (!project) return <></>

  return (
    <>
      <ProjectActiveTabContext.Provider
        value={{
          projectActiveTab,
          setProjectActiveTab,
        }}
      >
        <PageHeader
          breadcrumbRender={() => <Breadcrumb>{breadCrumbs}</Breadcrumb>}
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <ProjectIcon icon={project.icon} name={project.name} />
              {project.name}
            </div>
          }
          footer={<ProjectTabs projectId={projectId} />}
          extra={project.is_archive ? <Tag color={colors.error}>Archived</Tag> : null}
        ></PageHeader>
        <Content style={{ margin: "24px" }}>
          <Outlet context={projectId} />
        </Content>
      </ProjectActiveTabContext.Provider>
    </>
  )
}
