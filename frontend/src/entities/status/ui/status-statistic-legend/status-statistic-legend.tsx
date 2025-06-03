import { colors } from "shared/config"

import styles from "./styles.module.css"

interface Props extends HTMLDataAttribute {
  isActive?: boolean
  color: string
  label: React.ReactNode
  value: React.ReactNode
}

export const StatusStatisticLegend = ({ isActive, color, label, value, ...props }: Props) => {
  return (
    <div
      className={styles.row}
      style={{ borderBottom: isActive ? `1px solid ${colors.accent}` : "0" }}
      {...props}
    >
      <div className={styles.label}>
        <div className={styles.statusIcon} style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
