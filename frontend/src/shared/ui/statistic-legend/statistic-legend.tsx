import { Flex } from "antd"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import styles from "./styles.module.css"

interface Props {
  data: TestPlanStatistics[]
  maxVisibleItems?: number
  showFullAlways?: boolean
  renderStatus?: (data: TestPlanStatistics) => React.ReactNode
  testid?: string
}

export const StatisticLegend = ({
  data,
  renderStatus,
  showFullAlways = false,
  maxVisibleItems = 7,
  testid,
}: Props) => {
  const { t } = useTranslation()
  const [showAllStatuses, setShowAllStatuses] = useState(false)
  const maxItems = showFullAlways ? data.length : maxVisibleItems

  if (!data.length) return null

  return (
    <Flex vertical gap={16} data-testid={testid ? `${testid}-legend` : "statistic-legend"}>
      {renderStatus &&
        data
          ?.slice(0, showAllStatuses ? data.length : maxItems)
          .map((status) => renderStatus(status))}
      {!renderStatus &&
        data?.slice(0, showAllStatuses ? data.length : maxItems).map((status) => (
          <div key={status.id} className={styles.row}>
            <div className={styles.label}>
              <div className={styles.statusIcon} style={{ backgroundColor: status.color }} />
              <span>{status.label}</span>
            </div>
            <span className={styles.value}>{status.value}</span>
          </div>
        ))}
      {data && data.length > maxItems && !showFullAlways && (
        <span className={styles.showMore} onClick={() => setShowAllStatuses(!showAllStatuses)}>
          {showAllStatuses ? t("Show less") : t("Show more")}
        </span>
      )}
    </Flex>
  )
}
