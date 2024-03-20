import { PieChartOutlined, SettingOutlined, TableOutlined, UserOutlined } from "@ant-design/icons"
import { Layout, Menu, MenuProps } from "antd"
import { Link, Outlet } from "react-router-dom"
import { FooterView as Footer, HeaderView, SystemMessages } from "widgets"

import { MenuContext } from "."
import { useMain } from "./model/use-main"

const { Content, Sider } = Layout

const menuProps: MenuProps = {
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
        {
          label: (
            <Link to="/administration/users" id="sidebar-administration-users-btn">
              Users
            </Link>
          ),
          icon: <UserOutlined />,
          key: "administration.users",
        },
      ],
    },
  ],
}

export const Main = () => {
  const { collapsed, activeMenu, openSubMenu, onHandleCollapsed, setActiveMenu, setOpenSubMenu } =
    useMain()

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Sider collapsible collapsed={!collapsed} onCollapse={(value) => onHandleCollapsed(value)}>
          <div className="logo">TestY</div>
          <Menu
            {...{
              selectedKeys: activeMenu,
              onOpenChange: setOpenSubMenu,
              ...menuProps,
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
