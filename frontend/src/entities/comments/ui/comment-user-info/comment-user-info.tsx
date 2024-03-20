import dayjs from "dayjs"
import { HashLink } from "react-router-hash-link"

import { UserAvatar } from "entities/user/ui"

import styles from "./styles.module.css"

interface Props {
  commentId: number
  username: string
  avatarLink: string
  createdAt: string
  updatedAt: string
}

export const CommentUserInfo = ({
  commentId,
  username,
  avatarLink,
  createdAt,
  updatedAt,
}: Props) => {
  const path = window.location.pathname + window.location.search
  return (
    <div className={styles.userInfo}>
      <UserAvatar size={32} avatar_link={avatarLink} />
      <span>{username}</span>
      <span>added a comment</span>
      <HashLink to={path + `#comment-${commentId}`} className={styles.link}>
        {dayjs(createdAt).format("DD MMM YYYY HH:mm")}
      </HashLink>
      {!dayjs(updatedAt).isSame(createdAt) && <span className={styles.edited}> - edited</span>}
    </div>
  )
}
