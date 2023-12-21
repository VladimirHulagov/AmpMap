import { Tag } from "antd"

import { colors } from "shared/config"

interface TagBooleanProps {
  value: boolean
  trueText: string
  falseText: string
}

export const TagBoolean = ({ value, trueText, falseText }: TagBooleanProps) => {
  return value ? (
    <Tag color={colors.success}>{trueText}</Tag>
  ) : (
    <Tag color={colors.error}>{falseText}</Tag>
  )
}
