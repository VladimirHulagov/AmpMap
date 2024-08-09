import { BellOutlined, DownOutlined } from "@ant-design/icons"
import { Badge, Button, Dropdown, MenuProps, Space } from "antd"
import { useNotificationWS } from "entities/notifications/model/use-notification-ws"
import { Link, useNavigate } from "react-router-dom"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import styles from "./styles.module.css"
import { useAvatarLogic } from "./use-avatar"

export const AvatarView = () => {
  const { handleLogout, user } = useAvatarLogic()
  const { notificationsCount } = useNotificationWS()
  const navigate = useNavigate()

  const menu: MenuProps = {
    items: [
      {
        label: (
          <Link to="/profile" id="header-dropdown-profile-btn">
            Profile
          </Link>
        ),
        key: "profile",
      },
      { type: "divider" },
      {
        label: (
          <div onClick={handleLogout} id="header-dropdown-logout-btn">
            Logout
          </div>
        ),
        key: "logout",
      },
    ],
  }

  const handleRedirectToNotifications = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    navigate("/notifications")
  }

  return (
    <Dropdown
      {...{
        menu,
        trigger: ["click"],
        className: styles.dropdown,
      }}
    >
      <Space className="pointer">
        <Badge count={notificationsCount} showZero={false} color="blue">
          <Button icon={<BellOutlined />} onClick={(e) => handleRedirectToNotifications(e)} />
        </Badge>
        <UserAvatar avatar_link={user?.avatar_link ?? ""} size={32} />
        <span id="header-username">{user?.username}</span>
        <DownOutlined />
      </Space>
    </Dropdown>
  )
}
