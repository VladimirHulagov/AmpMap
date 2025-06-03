import classNames from "classnames"

import DotsIcon from "shared/assets/yi-icons/dots-2.svg?react"

import styles from "./styles.module.css"

interface Props {
  direction?: "left" | "right"
  onMouseDown: React.MouseEventHandler<HTMLDivElement>
  resizeLineColor?: string
}

export const ResizeLine = ({
  direction = "right",
  onMouseDown,
  resizeLineColor = "var(--y-сolor-secondary-border)",
}: Props) => {
  return (
    <div
      className={classNames(styles.resizeLine, styles[direction])}
      style={{ backgroundColor: resizeLineColor }}
      onMouseDown={onMouseDown}
    >
      <DotsIcon width={10} height={23} style={{ color: "var(--y-grey-30)" }} />
    </div>
  )
}
