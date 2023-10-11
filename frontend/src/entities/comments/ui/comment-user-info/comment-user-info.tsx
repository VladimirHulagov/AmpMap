import moment from "moment"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import styles from "./styles.module.css"

interface Props {
  username: string
  avatar_link: string
  created_at: string
  updated_at: string
}

export const CommentUserInfo = ({ username, avatar_link, created_at, updated_at }: Props) => {
  return (
    <div className={styles.userInfo}>
      <UserAvatar size={32} avatar_link={avatar_link} />
      <span>{username}</span>
      <span>added a comment - {moment(created_at).format("DD MMM YYYY HH:mm")}</span>
      {!moment(updated_at).isSame(created_at) && <span className={styles.edited}> - edited</span>}
    </div>
  )
}
