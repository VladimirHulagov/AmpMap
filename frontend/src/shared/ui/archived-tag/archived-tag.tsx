import { Tag, Tooltip } from "antd"

import { colors } from "shared/config"

export const ArchivedTag = () => {
  return (
    <Tooltip title="Archived">
      <Tag color={colors.error}>A</Tag>
    </Tooltip>
  )
}
