import { Button, Popover, Row } from "antd"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { LineStatisticLegendItem, LineStatisticProgress } from "shared/ui"

import { StatisticType } from "widgets/test-plan"

import { GraphIcon } from "./graph-icon"
import styles from "./test-plan-statistic-popover.module.css"

interface Props {
  statistics: ChildStatisticData
}

export const TestPlanStatisticPopover = ({ statistics }: Props) => {
  const { t } = useTranslation()
  const [type, setType] = useState<StatisticType>("count")

  if (!statistics.total.count.all) {
    return (
      <div className={styles.container} data-testid="test-plan-statistic-empty">
        <GraphIcon isActive={false} />
        <span>0/0</span>
      </div>
    )
  }

  const countData = type === "count" ? statistics.total.count : statistics.total.estimates

  const items = statistics.statistics.map((item) => ({
    label: item.label,
    value: type === "count" ? item.value : item.estimates,
    color: item.color,
    id: item.id,
  }))

  const shouldShowEstimates = statistics.total.estimates.all !== 0

  return (
    <Popover
      content={
        <div className={styles.popover} data-testid="test-plan-statistic-popover">
          <div>
            <Row align="middle" justify="space-between">
              <h3 className={styles.title}>Tests</h3>
              <Button
                type={type === "count" ? "default" : "text"}
                onClick={() => setType("count")}
                data-testid="test-plan-statistic-child-plans-count"
              >
                {t("Count")}
              </Button>
              <Button
                type={type === "estimates" ? "default" : "text"}
                onClick={() => setType("estimates")}
                data-testid="test-plan-statistic-child-plans-estimates"
                disabled={!shouldShowEstimates}
              >
                {t("Estimates")}
              </Button>
            </Row>
            <div className={styles.progressBar} data-testid="test-plan-statistic-progress">
              <LineStatisticProgress items={items} />
            </div>
            <div className={styles.legend} data-testid="test-plan-statistic-legend">
              {items
                .filter((item) => item.value > 0)
                .map((item) => (
                  <LineStatisticLegendItem key={item.id} item={item} total={countData.all} />
                ))}
            </div>
          </div>
        </div>
      }
      trigger="click"
      placement="bottom"
      rootClassName={styles.popoverContainer}
    >
      <div className={styles.container} data-testid="test-plan-statistic-container">
        <GraphIcon isActive />
        <span className={styles.active}>
          {statistics.total.count.notUntested}/{statistics.total.count.all}
        </span>
      </div>
    </Popover>
  )
}
