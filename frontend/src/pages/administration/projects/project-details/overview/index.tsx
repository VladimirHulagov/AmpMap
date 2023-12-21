import { Space } from "antd"
import { ArchiveProject, DeleteProject, EditProject } from "features/project"
import { useContext, useEffect } from "react"
import { useParams } from "react-router-dom"

import { useGetProjectQuery } from "entities/project/api"
import { ProjectIcon } from "entities/project/ui"

import { ProjectDetailsActiveTabContext } from "pages/administration/projects/project-details/project-details-main"

import { ContainerLoader, Field, TagBoolean } from "shared/ui"

export const ProjectFields = ({ project }: { project: Project }) => {
  return (
    <>
      <ProjectIcon icon={project.icon} name={project.name} />
      <Field title="Name" value={project?.name} />
      <Field title="Description" value={project?.description} />
      <Field
        title="Status"
        value={<TagBoolean value={!project?.is_archive} trueText="ACTIVE" falseText="ARCHIVED" />}
      />
    </>
  )
}

export const ProjectDetailsOverviewPage = () => {
  const { setProjectDetailsActiveTab } = useContext(ProjectDetailsActiveTabContext)!
  const { projectId } = useParams<ParamProjectId>()
  const { data, isLoading } = useGetProjectQuery(Number(projectId), { skip: !projectId })

  useEffect(() => {
    setProjectDetailsActiveTab("overview")
  })

  if (isLoading || !data) {
    return <ContainerLoader />
  }

  return (
    <>
      <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
        <Space style={{ marginBottom: "16px", float: "right" }}>
          <EditProject project={data} />
          {data.is_archive ? <DeleteProject project={data} /> : <ArchiveProject project={data} />}
        </Space>
        <ProjectFields project={data} />
      </div>
    </>
  )
}
