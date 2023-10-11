import { DownOutlined } from "@ant-design/icons"
import { Dropdown, MenuProps, Space } from "antd"
import { Link } from "react-router-dom"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import styles from "./styles.module.css"
import { useAvatarLogic } from "./use-avatar"

export const AvatarView = () => {
  const { handleLogout, user } = useAvatarLogic()

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

  return (
    <Dropdown
      {...{
        menu,
        trigger: ["click"],
        className: styles.dropdown,
      }}
    >
      <Space className="pointer">
        <UserAvatar avatar_link={user?.avatar_link || ""} size={32} />
        <span id="header-username">{user?.username}</span>
        <DownOutlined />
      </Space>
    </Dropdown>
  )
}
