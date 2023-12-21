import styles from "./styles.module.css"

interface Props {
  title: string
  count: number
}

export const StatisticEntityInfo = ({ title, count }: Props) => {
  return (
    <div className={styles.statisticBlock}>
      <span className={styles.statisticValue}>{count}</span>
      <span>{title}</span>
    </div>
  )
}
