import { Space } from "antd"
import { useContext, useEffect } from "react"
import { useParams } from "react-router-dom"

import { useGetProjectQuery } from "entities/project/api"

import { ProjectDetailsActiveTabContext } from "pages/administration/projects/project-details/project-details-main"

import { AddUserProjectAccess } from "widgets/user/user-project-access-modal/add-user-project-access"
import { UserProjectAccessModal } from "widgets/user/user-project-access-modal/user-project-access-modal"
import { UsersProjectAccessTable } from "widgets/user/users-project-access-table/users-project-access-table"

export const ProjectDetailsAccessManagementPage = () => {
  const { setProjectDetailsActiveTab } = useContext(ProjectDetailsActiveTabContext)!
  const { projectId } = useParams<ParamProjectId>()
  const { data } = useGetProjectQuery(Number(projectId), { skip: !projectId })

  useEffect(() => {
    setProjectDetailsActiveTab("access-management")
  }, [])

  return (
    <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        {data?.is_manageable && <AddUserProjectAccess />}
      </Space>
      <UsersProjectAccessTable isManageable={data?.is_manageable} />
      <UserProjectAccessModal />
    </div>
  )
}
