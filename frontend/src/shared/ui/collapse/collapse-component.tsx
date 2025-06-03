import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"

import { ContainerLoader } from "../container-loader"
import styles from "./styles.module.css"

interface Props extends HTMLDataAttribute {
  children: React.ReactNode
  title: React.ReactNode | string
  isLoading: boolean
  isCollapsed: boolean
  onOpen: () => void
  style?: React.CSSProperties
  titleProps?: React.HTMLAttributes<HTMLDivElement>
}

export const CollapseComponent = ({
  style,
  onOpen,
  title,
  isCollapsed,
  isLoading,
  children,
  ...props
}: Props) => {
  return (
    <div className={styles.collapseBlock} style={style} {...props}>
      <div className={styles.collapseBlockHeader} onClick={onOpen}>
        <ArrowIcon
          width={24}
          height={24}
          style={{ transform: `rotate(${isCollapsed ? 270 : 360}deg)`, color: "var(--y-grey-35)" }}
        />
        {typeof title === "string" ? (
          <span className={styles.collapseBlockTitle}>{title}</span>
        ) : (
          title
        )}
      </div>
      {!isCollapsed && (isLoading ? <ContainerLoader /> : children)}
    </div>
  )
}
