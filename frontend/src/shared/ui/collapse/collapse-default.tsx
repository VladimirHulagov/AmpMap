import React, { useEffect, useState } from "react"

import { CollapseComponent } from "./collapse-component"

interface Props extends HTMLDataAttribute {
  children: React.ReactNode
  collapse?: boolean
  defaultCollapse?: boolean
  title: React.ReactNode | string
  isLoading?: boolean
  cacheKey?: string
  onOpenChange?: (toggle: boolean) => void
  style?: React.CSSProperties
}

export const CollapseDefault = ({
  children,
  collapse,
  defaultCollapse = false,
  title,
  isLoading = false,
  onOpenChange,
  style,
  ...props
}: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapse)

  const handleOpen = () => {
    if (onOpenChange) {
      onOpenChange(!isCollapsed)
    }
    setIsCollapsed(!isCollapsed)
  }

  useEffect(() => {
    if (collapse === undefined) return
    setIsCollapsed(collapse)
  }, [collapse])

  return (
    <CollapseComponent
      children={children}
      isLoading={isLoading}
      onOpen={handleOpen}
      title={title}
      isCollapsed={isCollapsed}
      style={style}
      {...props}
    />
  )
}
