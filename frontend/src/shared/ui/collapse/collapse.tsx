import { useEffect } from "react"

import { icons } from "shared/assets/inner-icons"
import { useCacheState } from "shared/hooks"
import { toBool } from "shared/libs"

import { ContainerLoader } from "../container-loader"
import styles from "./styles.module.css"

const { ArrowIcon } = icons

interface Props {
  children: React.ReactNode
  cacheKey: string
  collapse?: boolean
  defaultCollapse?: boolean
  title: React.ReactNode
  isLoading?: boolean
  onOpenChange?: (toggle: boolean) => void
}

export const Collapse = ({
  children,
  cacheKey,
  collapse,
  defaultCollapse = false,
  title,
  isLoading = false,
  onOpenChange,
}: Props) => {
  const [value, update] = useCacheState(`collapse-${cacheKey}`, defaultCollapse)
  const boolValue = toBool(String(value))

  const handleOpen = () => {
    if (onOpenChange) {
      onOpenChange(!boolValue)
    }
    update(!boolValue)
  }

  useEffect(() => {
    if (collapse === undefined) return
    update(collapse)
  }, [collapse])

  return (
    <div className={styles.collapseBlock}>
      <div className={styles.collapseBlockTitle} onClick={handleOpen}>
        <ArrowIcon
          width={24}
          height={24}
          style={{ transform: `rotate(${boolValue ? 270 : 360}deg)` }}
        />
        {title}
      </div>
      {!boolValue && !isLoading && children}
      {isLoading && !boolValue && <ContainerLoader />}
    </div>
  )
}
