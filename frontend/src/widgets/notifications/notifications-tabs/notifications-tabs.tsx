import { Tabs } from "antd"
import { useContext } from "react"
import { useNavigate } from "react-router-dom"

import { NotificationsActiveTabContext } from "pages/notifications/notifications-page"

export const NotificationsTabs = () => {
  const navigate = useNavigate()
  const { activeTab, setActiveTab } = useContext(NotificationsActiveTabContext)!

  const tabItems = [
    { label: "Overview", key: "overview", path: `/notifications` },
    {
      label: "Settings",
      key: "settings",
      path: "/notifications/settings",
    },
  ]

  const onChange = (key: string) => {
    const activeTabItem = tabItems.find((i) => i.key === key)
    if (!activeTabItem) return
    navigate(activeTabItem.path)
    setActiveTab(key)
  }

  return <Tabs activeKey={activeTab} items={tabItems} onChange={onChange} />
}
