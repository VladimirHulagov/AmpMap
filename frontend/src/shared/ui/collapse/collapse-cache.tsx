import { useEffect } from "react"

import { useCacheState } from "shared/hooks"
import { toBool } from "shared/libs"

import { CollapseComponent } from "./collapse-component"

interface Props extends HTMLDataAttribute {
  children: React.ReactNode
  cacheKey: string
  collapse?: boolean
  defaultCollapse?: boolean
  title: React.ReactNode | string
  isLoading?: boolean
  onOpenChange?: (toggle: boolean) => void
  style?: React.CSSProperties
}

export const CollapseCache = ({
  children,
  cacheKey,
  collapse,
  defaultCollapse = false,
  title,
  isLoading = false,
  onOpenChange,
  style,
  ...props
}: Props) => {
  const [isCollapsed, setIsCollapsed] = useCacheState(
    `collapse-${cacheKey}`,
    Boolean(defaultCollapse),
    toBool
  )

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
