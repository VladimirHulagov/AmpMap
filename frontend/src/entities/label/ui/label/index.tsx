import { CloseOutlined, EditOutlined } from "@ant-design/icons"
import { Tag } from "antd"
import classNames from "classnames"

import { colors } from "shared/config"
import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface LabelProps {
  content: string
  color?: string
  onClick?: (label: LabelInForm) => void
  onDelete?: (label: LabelInForm) => void
  onEdit?: (label: LabelInForm) => void
  className?: string
}

export const Label = ({ content, color, onDelete, onClick, onEdit, className }: LabelProps) => {
  return (
    <Tag
      className={classNames(styles.label, className)}
      color={color !== "line-through" ? color : colors.accent}
      style={{
        cursor: onClick ? "pointer" : "default",
        textDecoration: color === "line-through" ? "line-through" : undefined,
      }}
      onClick={onClick ? () => onClick({ name: content }) : undefined}
      data-testid={`label-${content}`}
    >
      {content}
      {onEdit && (
        <Button
          id="label-edit"
          className={styles.btn}
          icon={<EditOutlined style={{ fontSize: 14 }} />}
          color="accent"
          shape="circle"
          size="s"
          onClick={() => onEdit({ name: content })}
          data-testid={`label-edit-${content}`}
        />
      )}
      {onDelete && (
        <Button
          id="label-delete"
          className={styles.btn}
          icon={<CloseOutlined style={{ fontSize: 14 }} />}
          color="accent"
          shape="circle"
          size="s"
          onClick={() => onDelete({ name: content })}
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
          data-testid={`label-delete-${content}`}
        />
      )}
    </Tag>
  )
}
