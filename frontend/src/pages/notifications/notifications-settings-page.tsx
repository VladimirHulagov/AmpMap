import { Breadcrumb, Card } from "antd"
import { Content } from "antd/es/layout/layout"
import { useContext, useEffect } from "react"
import { Link } from "react-router-dom"
import { NotificationSettingsTable } from "widgets"

import { NotificationsActiveTabContext } from "./notifications-page"

export const NotificationSettingsPage = () => {
  const { setActiveTab, setBreadcrumbItems, setTitle } = useContext(NotificationsActiveTabContext)!

  useEffect(() => {
    setActiveTab("settings")
    setBreadcrumbItems([
      <Breadcrumb.Item key="notifications">
        <Link to="/notifications">Notifications</Link>
      </Breadcrumb.Item>,
      <Breadcrumb.Item key="settings">Settings</Breadcrumb.Item>,
    ])
    setTitle("Notifications Settings")
  }, [])

  return (
    <Card>
      <Content>
        <NotificationSettingsTable />
      </Content>
    </Card>
  )
}
