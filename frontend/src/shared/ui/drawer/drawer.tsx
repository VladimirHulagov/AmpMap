import { Flex } from "antd"
import classNames from "classnames"
import { ReactNode, useLayoutEffect, useRef, useState } from "react"

import PinIcon from "shared/assets/icons/pin.svg?react"
import CloseIcon from "shared/assets/yi-icons/close.svg?react"
import { useCacheState, useOnClickOutside, useResizebleBlock } from "shared/hooks"
import { toBool } from "shared/libs"

import { Portal } from "widgets/[ui]/portal"

import { ContainerLoader } from "../container-loader"
import { ResizeLine } from "../resize-line/resize-line"
import styles from "./styles.module.css"

interface Props {
  id: string
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
  header?: React.ReactNode
  cls?: string
  children?: ReactNode
  baseWidth?: number
  minWidth?: number
  swipeElement?: ReactNode
  showSwipeElement?: boolean
  resizeLineColor?: string
}

const MAX_WITH_PERCENT = 70
const INGNORED_LIST_OUTSIDE_CLICK = [
  ".ant-modal-root",
  ".ant-popover-content",
  ".anticon-close-circle",
  ".ant-notification-notice-wrapper",
  ".ant-select-dropdown",
  ".ant-dropdown",
  ".ant-picker-dropdown",
]

export const Drawer = ({
  id,
  isOpen,
  isLoading = false,
  minWidth = 500,
  baseWidth = minWidth,
  onClose,
  header,
  children,
  resizeLineColor,
  swipeElement,
  showSwipeElement,
}: Props) => {
  const [isPinned, setIsPinned] = useCacheState(`isDrawerPinned`, false, toBool)
  const [secondaryElement, setSecondaryElement] = useState<ReactNode>()

  useLayoutEffect(() => {
    if (showSwipeElement) {
      setSecondaryElement(swipeElement)
      return
    }

    const timerId = setTimeout(() => {
      setSecondaryElement(undefined)
    }, 200)

    return () => clearTimeout(timerId)
  }, [showSwipeElement, swipeElement])

  const handlePin = () => {
    setIsPinned(!isPinned)
  }

  const drawerRef = useRef<HTMLDivElement>(null)
  const { width, handleMouseDown } = useResizebleBlock({
    key: id,
    elRef: drawerRef,
    defaultWidth: baseWidth,
    minWidth: minWidth,
    maxWidth: MAX_WITH_PERCENT,
    maxAsPercent: true,
    direction: "left",
  })
  useOnClickOutside(drawerRef, onClose, isOpen && !isPinned, INGNORED_LIST_OUTSIDE_CLICK)

  return (
    <Portal id="portal-root">
      <div
        id={id}
        ref={drawerRef}
        style={{ width }}
        className={classNames(styles.wrapper, {
          [styles.isOpen]: isOpen,
        })}
      >
        <ResizeLine
          onMouseDown={handleMouseDown}
          direction="left"
          resizeLineColor={resizeLineColor}
        />
        {isLoading && (
          <div className={styles.loaderBlock}>
            <ContainerLoader />
          </div>
        )}
        {!isLoading && (
          <Flex
            className={classNames(styles.drawerContent, {
              [styles.showSecondary]: showSwipeElement,
            })}
          >
            <div className={styles.primaryElement}>
              <Flex className={styles.header}>
                <div className={styles.headerIcons}>
                  <CloseIcon
                    data-testid="drawer-close-icon"
                    className={styles.icon}
                    onClick={onClose}
                  />
                  <PinIcon
                    data-testid="drawer-pin-icon"
                    className={classNames(styles.icon, { [styles.iconActive]: isPinned })}
                    onClick={handlePin}
                  />
                </div>
                {header}
              </Flex>
              <div className={styles.body}>{children}</div>
            </div>
            <Flex vertical className={styles.secondaryElement}>
              {secondaryElement}
            </Flex>
          </Flex>
        )}
      </div>
    </Portal>
  )
}
