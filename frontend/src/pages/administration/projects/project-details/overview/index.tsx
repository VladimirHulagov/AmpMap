import { DeleteOutlined, EditOutlined } from "@ant-design/icons"
import { Button, Dropdown, MenuProps, Space } from "antd"
import { useContext, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"

import { useGetProjectQuery } from "entities/project/api"
import { setProject, showEditProjectModal } from "entities/project/model"
import { CreateEditProjectModal } from "entities/project/ui/modals/create-edit-project-modal"
import { ProjectArchiveModal } from "entities/project/ui/modals/project-archive-modal"
import { ProjectDeleteModal } from "entities/project/ui/modals/project-delete-modal"

import {
  ProjectDetailsActiveTabContext,
  ProjectDetailsActiveTabContextType,
} from "pages/administration/projects/project-details/project-details-main"

import { ContainerLoader, Field, TagBoolean } from "shared/ui"

export const ProjectFields = ({ project }: { project: IProject }) => {
  return (
    <>
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
  const dispatch = useDispatch()
  const { setProjectDetailsActiveTab } = useContext(
    ProjectDetailsActiveTabContext
  ) as ProjectDetailsActiveTabContextType
  const { projectId } = useParams<ParamProjectId>()
  const { data, isLoading, isFetching, isSuccess } = useGetProjectQuery(Number(projectId))
  const [isShowProjectDeleteModal, setIsShowProjectDeleteModal] = useState(false)
  const [isShowProjectArchiveModal, setIsShowProjectArchiveModal] = useState(false)

  useEffect(() => {
    setProjectDetailsActiveTab("overview")
  })

  useEffect(() => {
    if (isSuccess) {
      dispatch(setProject(data))
    }
  }, [isFetching])

  const showProjectDetails = () => {
    dispatch(showEditProjectModal())
  }

  const handleButtonDeleteClick = () => {
    setIsShowProjectDeleteModal(true)
  }

  const handleButtonArchiveClick = () => {
    setIsShowProjectArchiveModal(true)
  }

  const ButtonDelete = () => (
    <Button id="delete-project" icon={<DeleteOutlined />} danger onClick={handleButtonDeleteClick}>
      Delete
    </Button>
  )

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: <ButtonDelete />,
    },
  ]

  if (isLoading || !data) {
    return <ContainerLoader />
  }

  return (
    <>
      <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
        <Space style={{ marginBottom: "16px", float: "right" }}>
          <Button
            id="edit-project"
            icon={<EditOutlined />}
            onClick={() => {
              showProjectDetails()
            }}
          >
            Edit
          </Button>
          {data.is_archive ? (
            <ButtonDelete />
          ) : (
            <Dropdown.Button menu={{ items }} danger onClick={handleButtonArchiveClick}>
              Archive
            </Dropdown.Button>
          )}
          <CreateEditProjectModal />
        </Space>
        <ProjectFields project={data} />
        <ProjectDeleteModal
          isShow={isShowProjectDeleteModal}
          setIsShow={setIsShowProjectDeleteModal}
          project={data}
        />
        <ProjectArchiveModal
          isShow={isShowProjectArchiveModal}
          setIsShow={setIsShowProjectArchiveModal}
          project={data}
        />
      </div>
    </>
  )
}
