import cn from "classnames"
import { useTranslation } from "react-i18next"

import { LineStatisticLegend } from "./line-statistic-legend"
import styles from "./line-statistic.module.css"
import { StatisticLineProps } from "./line-statistic.types"

export const LineStatisticProgressBar = ({ items }: Pick<StatisticLineProps, "items">) => {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const isEmpty = total === 0

  return (
    <div
      className={cn(styles.progressBar, {
        [styles.progressBarEmpty]: isEmpty,
      })}
    >
      {items.map((item, index) => {
        const previousWidth = items
          .slice(0, index)
          .reduce((sum, prev) => sum + (prev.value / total) * 100, 0)

        const width = (item.value / total) * 100

        return (
          <div
            key={item.label}
            className={styles.segment}
            style={{
              backgroundColor: isEmpty ? "white" : item.color,
              width: `${width}%`,
              left: `${previousWidth}%`,
            }}
            title={`${item.label}: ${item.value} (${width.toFixed(2)}%)`}
          />
        )
      })}
    </div>
  )
}

export const LineStatistic = ({ items, type }: StatisticLineProps) => {
  const { t } = useTranslation()
  const notNullItems = items.filter((item) => item.value > 0)

  const getLineComponent = () => {
    if (items.length === 0 || (notNullItems.length === 0 && type === "estimates")) {
      return null
    }

    return <LineStatisticLegend items={notNullItems} type={type} />
  }

  const getProgressComponent = () => {
    if (items.length === 0) {
      return null
    }

    if (notNullItems.length === 0 && type === "estimates") {
      return t("No estimates provided")
    }

    return <LineStatisticProgressBar items={notNullItems} />
  }

  return (
    <div className={styles.container}>
      {getProgressComponent()}
      {getLineComponent()}
    </div>
  )
}
