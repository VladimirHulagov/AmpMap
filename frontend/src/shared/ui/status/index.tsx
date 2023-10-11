import { Tag } from "antd"

import { colors } from "shared/config"

interface StatusProps {
  value: string
}

export const Status = ({ value }: StatusProps) => {
  let color = "default"
  switch (value.toLowerCase()) {
    case "failed": {
      color = colors.error
      break
    }
    case "passed": {
      color = colors.success
      break
    }
    case "skipped": {
      color = colors.skipped
      break
    }
    case "broken": {
      color = colors.broken
      break
    }
    case "blocked": {
      color = colors.bloked
      break
    }
    case "untested": {
      color = "default"
      break
    }
    case "retest": {
      color = colors.warning
      break
    }
  }

  return (
    <Tag className="status" color={color} id="status">
      {value.toUpperCase()}
    </Tag>
  )
}
