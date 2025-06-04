import { Space } from "antd"

import { useProjectContext } from "pages/project"

import { AddUserProjectAccess, UserProjectAccessModal, UsersProjectAccessTable } from "widgets/user"

export const ProjectAccessManagementTabPage = () => {
  const project = useProjectContext()

  return (
    <>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        {project.is_manageable && <AddUserProjectAccess />}
      </Space>
      <UsersProjectAccessTable isManageable={project.is_manageable} />
      <UserProjectAccessModal />
    </>
  )
}
