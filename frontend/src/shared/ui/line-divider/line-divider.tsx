import classNames from "classnames"

import styles from "./styles.module.css"

interface Props {
  onMouseDown: (event: React.MouseEvent) => void
  focus: boolean
  style?: React.CSSProperties
}

export const LineDivider = ({ onMouseDown, focus, style }: Props) => {
  return (
    <div
      className={classNames(styles.dividerWrapper, { [styles.focus]: focus })}
      onMouseDown={onMouseDown}
      style={style}
    >
      <div className={styles.divider} />
    </div>
  )
}
