import { PieChartOutlined, SettingOutlined, TableOutlined, UserOutlined } from "@ant-design/icons"
import { Layout, Menu, MenuProps, notification } from "antd"
import { useEffect } from "react"
import { Link, Outlet, useSearchParams } from "react-router-dom"
import { FooterView as Footer, HeaderView, SystemMessages } from "widgets"

import { useAppSelector } from "app/hooks"

import { selectUser } from "entities/auth/model"

import { MenuContext } from "."
import { useMain } from "./model/use-main"

const { Content, Sider } = Layout

const getMenuProps = (user: User | null): MenuProps => ({
  mode: "inline",
  items: [
    {
      label: (
        <Link to="/" id="sidebar-dashboard-btn">
          Dashboard
        </Link>
      ),
      icon: <PieChartOutlined />,
      key: "dashboard",
    },
    {
      label: <span id="sidebar-administration-btn">Administration</span>,
      key: "administration",
      icon: <SettingOutlined />,
      children: [
        {
          label: (
            <Link to="/administration/projects" id="sidebar-administration-projects-btn">
              Projects
            </Link>
          ),
          icon: <TableOutlined />,
          key: "administration.projects",
        },
        user?.is_superuser
          ? {
              label: (
                <Link to="/administration/users" id="sidebar-administration-users-btn">
                  Users
                </Link>
              ),
              icon: <UserOutlined />,
              key: "administration.users",
            }
          : null,
      ],
    },
  ],
})

export const Main = () => {
  const { collapsed, activeMenu, openSubMenu, onHandleCollapsed, setActiveMenu, setOpenSubMenu } =
    useMain()
  const user = useAppSelector(selectUser)

  const [searchParams] = useSearchParams()
  const { error, errorPage } = Object.fromEntries(searchParams)
  useEffect(() => {
    if (error === "403") {
      notification.error({
        message: "Error",
        description: `You do not have permission to access ${errorPage ?? "this"} page`,
      })
      searchParams.delete("errorPage")
      searchParams.delete("error")
    }
  }, [error])

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Sider collapsible collapsed={!collapsed} onCollapse={(value) => onHandleCollapsed(value)}>
          <div className="logo">TestY</div>
          <Menu
            {...{
              selectedKeys: activeMenu,
              onOpenChange: setOpenSubMenu,
              ...getMenuProps(user),
            }}
          />
        </Sider>
        <Layout className="site-layout">
          <SystemMessages />
          <HeaderView />
          <Content>
            <MenuContext.Provider
              value={{ activeMenu, setActiveMenu, openSubMenu, setOpenSubMenu }}
            >
              <Outlet />
            </MenuContext.Provider>
          </Content>
          <Footer />
        </Layout>
      </Layout>
    </Layout>
  )
}
