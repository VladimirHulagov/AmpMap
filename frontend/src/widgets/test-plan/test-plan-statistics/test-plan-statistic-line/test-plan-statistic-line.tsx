import { Tooltip } from "antd"
import { StatisticType } from "widgets"

import { LineStatistic } from "shared/ui"

import styles from "./test-plan-statistic-line.module.css"

interface Props {
  data: ChildStatisticData
  type: StatisticType
}

export const TestPlanStatisticLine = ({ data, type }: Props) => {
  const items =
    data.statistics.map((item) => ({
      label: item.label,
      value: type === "count" ? item.value : item.estimates,
      color: item.color,
      id: item.id,
    })) ?? []

  const countData = type === "count" ? data.total.count : data.total.estimates
  const percentage = countData.all ? (countData.notUntested / countData.all) * 100 : 0

  return (
    <div className={styles.container} data-testid={`test-plan-statistic-container-${data.title}`}>
      <div className={styles.infoBlock}>
        <h4 className={styles.title} data-testid="test-plan-statistic-title">
          <Tooltip title={data.title}>{data.title}</Tooltip>
        </h4>
        <p className={styles.infoRow} data-testid="test-plan-statistic-info-row">
          <strong>
            {countData.notUntested}/{countData.all}
          </strong>{" "}
          ({percentage.toFixed(2)}%)
        </p>
      </div>
      <LineStatistic items={items} type={type} />
    </div>
  )
}
