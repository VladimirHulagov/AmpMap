import { PlusOutlined } from "@ant-design/icons"
import { Breadcrumb, Button, Layout, PageHeader, Space } from "antd"
import { useContext, useEffect } from "react"
import { useDispatch } from "react-redux"

import { showCreateUserModal } from "entities/user/model"

import { MenuContext } from "widgets/[ui]/main"
import { CreateEditUserModal, UsersTable } from "widgets/user"

const { Content } = Layout

export const UsersPage = () => {
  const { setActiveMenu, setOpenSubMenu } = useContext(MenuContext)!
  const dispatch = useDispatch()
  useEffect(() => {
    setOpenSubMenu(["administration"])
    setActiveMenu(["administration.users"])
  }, [])

  const breadcrumbItems = [
    <Breadcrumb.Item key="administration">Administration</Breadcrumb.Item>,
    <Breadcrumb.Item key="users">Users</Breadcrumb.Item>,
  ]

  const handleClick = () => {
    dispatch(showCreateUserModal())
  }

  return (
    <>
      <PageHeader
        breadcrumbRender={() => <Breadcrumb>{breadcrumbItems}</Breadcrumb>}
        title="Users"
      ></PageHeader>

      <Content style={{ margin: "24px" }}>
        <CreateEditUserModal />

        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
          <Space style={{ display: "flex", justifyContent: "right" }}>
            <Button
              id="create-user"
              onClick={handleClick}
              type={"primary"}
              icon={<PlusOutlined />}
              style={{ marginBottom: 16, float: "right" }}
            >
              Create user
            </Button>
          </Space>
          <UsersTable />
        </div>
      </Content>
    </>
  )
}
