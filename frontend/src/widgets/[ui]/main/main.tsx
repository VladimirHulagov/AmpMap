import { PieChartOutlined, SettingOutlined, TableOutlined, UserOutlined } from "@ant-design/icons"
import { Layout, Menu, MenuProps } from "antd"
import { ResultStatusType } from "antd/es/result"
import { useEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { FooterView as Footer, HeaderView, SystemMessages } from "widgets"

import { useAppDispatch, useAppSelector } from "app/hooks"
import { handleError, selectAppError } from "app/slice"

import { selectUser } from "entities/auth/model"

import { ErrorPage } from "pages/error-page/error-page"

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
  const dispatch = useAppDispatch()
  const location = useLocation()
  const user = useAppSelector(selectUser)
  const appError = useAppSelector(selectAppError)

  useEffect(() => {
    dispatch(handleError(null))
  }, [location.pathname])

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
          {appError ? (
            <ErrorPage code={appError.code as ResultStatusType} message={appError.message} />
          ) : (
            <Content>
              <MenuContext.Provider
                value={{ activeMenu, setActiveMenu, openSubMenu, setOpenSubMenu }}
              >
                <Outlet />
              </MenuContext.Provider>
            </Content>
          )}
          <Footer />
        </Layout>
      </Layout>
    </Layout>
  )
}
