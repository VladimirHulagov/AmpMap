import { useState } from "react"

import { useCacheState } from "./use-cache-state"

interface Props {
  key: string
  elRef: React.RefObject<HTMLDivElement>
  defaultWidth: number
  minWidth: number
  maxWidth: number
  direction?: "left" | "right"
  maxAsPercent?: boolean
  containerRef?: React.RefObject<HTMLDivElement>
  updater?: (width: number) => void
}

export const useResizebleBlock = ({
  key,
  elRef,
  defaultWidth,
  minWidth,
  maxWidth,
  maxAsPercent = false,
  direction = "right",
  updater,
  containerRef,
}: Props) => {
  const [value, update] = useCacheState(`${key}-width`, defaultWidth, Number)
  const [focus, setFocus] = useState(false)

  const updateCursor = () => {
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const resetCursor = () => {
    document.body.style.removeProperty("cursor")
    document.body.style.removeProperty("user-select")
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const element = elRef.current
    if (!element) {
      return
    }

    setFocus(true)

    const startPosX = e.clientX
    const styles = window.getComputedStyle(element)
    const w = parseInt(styles.width, 10)

    const handleMouseMove = (moveEvent: React.MouseEvent<HTMLDivElement>) => {
      const offset =
        direction === "right" ? moveEvent.clientX - startPosX : startPosX - moveEvent.clientX
      const calcNewWidth = w + offset

      const containerWidth = containerRef?.current?.clientWidth ?? document.body.clientWidth

      const calcMaxWidth = maxAsPercent ? (containerWidth / 100) * maxWidth : maxWidth
      const newWidth = Math.min(Math.max(calcNewWidth, minWidth), calcMaxWidth)
      updater?.(newWidth)
      update(newWidth)
      updateCursor()
    }

    const handleMouseUp = () => {
      setFocus(false)
      // @ts-ignore
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      resetCursor()
    }

    // @ts-ignore
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const setWidth = (width: number) => {
    const element = elRef.current
    if (element) {
      element.style.width = `${width}px`
      update(width)
    }
  }

  return {
    handleMouseDown,
    setWidth,
    width: value,
    focus,
  }
}
