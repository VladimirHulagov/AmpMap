import { Button, Empty, Row } from "antd"
import cn from "classnames"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"

import { useTestPlanStatisticsContext } from "entities/test-plan/model"

import { ContainerLoader } from "shared/ui"

import { TestPlanStatisticLine } from "../test-plan-statistic-line/test-plan-statistic-line"
import styles from "./test-plan-child-statistic.module.css"

export type StatisticType = "count" | "estimates"

export const TestPlanChildStatistic = () => {
  const { t } = useTranslation()
  const { ref, inView } = useInView()
  const [type, setType] = useState<StatisticType>("count")
  const { childStatistics, isLoading } = useTestPlanStatisticsContext()

  const arrayData = Object.values(childStatistics ?? {})
    .filter((child) => child.isRoot)
    .sort((a, b) => a.order - b.order)

  if (isLoading) {
    return (
      <div className={styles.container}>
        <ContainerLoader />
      </div>
    )
  }
  if (!arrayData?.length) {
    return (
      <div className={styles.container}>
        <Empty />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Row justify="space-between">
        <h3>{t("Child Plans Progress")}</h3>
        <Row>
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
          >
            {t("Estimates")}
          </Button>
        </Row>
      </Row>
      <div className={cn(styles.linesContainer, { [styles.linesContainerOverflow]: !inView })}>
        {arrayData.map((childData) => (
          <TestPlanStatisticLine key={childData.id} data={childData} type={type} />
        ))}
        <div ref={ref} style={{ height: "5px", marginBottom: "5px" }} />
      </div>
    </div>
  )
}
