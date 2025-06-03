import { Tag } from "antd"
import React from "react"

import { colors } from "shared/config"

import styles from "./styles.module.css"

interface StatusProps {
  content: React.ReactNode
  color?: string
  onClick?: (status: StatusInForm) => void
}

export const Status = ({ content, color, onClick }: StatusProps) => {
  return (
    <Tag
      className={styles.status}
      color={color !== "line-through" ? color : colors.accent}
      style={{
        cursor: onClick ? "pointer" : "default",
        textDecoration: color === "line-through" ? "line-through" : undefined,
      }}
      onClick={onClick ? () => onClick({ name: String(content) }) : undefined}
    >
      {content}
    </Tag>
  )
}
