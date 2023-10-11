import { CloseOutlined, EditOutlined } from "@ant-design/icons"
import { Button, Tag } from "antd"
import React from "react"

import styles from "./styles.module.css"

interface LabelProps {
  content: React.ReactNode
  color?: string
  onClick?: (label: LabelInForm) => void
  onDelete?: (label: LabelInForm) => void
  onEdit?: (label: LabelInForm) => void
}

export const Label = ({ content, color, onDelete, onClick, onEdit }: LabelProps) => {
  return (
    <Tag
      className={styles.label}
      color={color}
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick ? () => onClick({ name: String(content) }) : undefined}
    >
      {content}
      {onEdit && (
        <Button
          id="label-edit"
          className={styles.btn}
          icon={<EditOutlined style={{ fontSize: 14 }} />}
          shape="default"
          onClick={() => onEdit({ name: String(content) })}
        />
      )}
      {onDelete && (
        <Button
          id="label-delete"
          className={styles.btn}
          icon={<CloseOutlined style={{ fontSize: 14 }} />}
          shape="default"
          onClick={() => onDelete({ name: String(content) })}
        />
      )}
    </Tag>
  )
}
