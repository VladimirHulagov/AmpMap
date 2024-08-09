import { PageHeader } from "@ant-design/pro-layout"
import { Breadcrumb, Layout } from "antd"
import { createContext, useContext, useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { MenuContext, MenuContextType, NotificationsTabs } from "widgets"

const { Content } = Layout

export interface NotificationsActiveTabContextType {
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
  setBreadcrumbItems: React.Dispatch<React.SetStateAction<React.ReactNode[]>>
  setTitle: React.Dispatch<React.SetStateAction<string>>
}

export const NotificationsActiveTabContext =
  createContext<NotificationsActiveTabContextType | null>(null)

export const NotificationsPage = () => {
  const { setActiveMenu } = useContext(MenuContext) as unknown as MenuContextType
  const [activeTab, setActiveTab] = useState("")
  const [breadcrumbItems, setBreadcrumbItems] = useState<React.ReactNode[]>([])
  const [title, setTitle] = useState("")

  useEffect(() => {
    setActiveMenu(["dashboard"])
  }, [])

  return (
    <NotificationsActiveTabContext.Provider
      value={{
        activeTab,
        setActiveTab,
        setBreadcrumbItems,
        setTitle,
      }}
    >
      <PageHeader
        breadcrumbRender={() => <Breadcrumb>{breadcrumbItems}</Breadcrumb>}
        title={title}
        footer={<NotificationsTabs />}
        style={{ paddingBottom: 0 }}
      ></PageHeader>
      <Content style={{ margin: "24px" }}>
        <Outlet />
      </Content>
    </NotificationsActiveTabContext.Provider>
  )
}
