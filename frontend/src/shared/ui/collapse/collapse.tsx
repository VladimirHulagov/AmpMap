import React from "react"

import { CollapseCache } from "./collapse-cache"
import { CollapseDefault } from "./collapse-default"

interface Props extends HTMLDataAttribute {
  children: React.ReactNode
  collapse?: boolean
  defaultCollapse?: boolean
  title: React.ReactNode | string
  titleProps?: React.HTMLAttributes<HTMLDivElement>
  isLoading?: boolean
  cacheKey?: string
  onOpenChange?: (toggle: boolean) => void
  style?: React.CSSProperties
}

export const Collapse = ({ cacheKey, ...props }: Props) => {
  if (cacheKey) {
    return <CollapseCache cacheKey={cacheKey} {...props} />
  }

  return <CollapseDefault {...props} />
}
