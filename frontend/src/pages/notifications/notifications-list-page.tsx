import { Breadcrumb, Card } from "antd"
import { Content } from "antd/es/layout/layout"
import { useContext, useEffect } from "react"

import { NotificationsTable } from "widgets/notifications/notifications-table/notifications-table"

import { NotificationsActiveTabContext } from "./notifications-page"

export const NotificationListPage = () => {
  const { setActiveTab, setBreadcrumbItems, setTitle } = useContext(NotificationsActiveTabContext)!

  useEffect(() => {
    setActiveTab("overview")
    setBreadcrumbItems([<Breadcrumb.Item key="notifications">Notifications</Breadcrumb.Item>])
    setTitle("Notifications")
  }, [])

  return (
    <Card>
      <Content>
        <NotificationsTable />
      </Content>
    </Card>
  )
}
