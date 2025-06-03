import { Flex, Spin } from "antd"
import { useTranslation } from "react-i18next"

import { useAppSelector } from "app/hooks"

import { selectFilter } from "entities/test/model"

import { Pie } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  data: TestPlanStatistics[]
  isLoading: boolean
  height: number
  onHeightChange: (height: number) => void
}

export const TestPlanPieCount = ({ data, isLoading, height, onHeightChange }: Props) => {
  const { t } = useTranslation()
  const testsFilter = useAppSelector(selectFilter)

  return (
    <div className={styles.pieWrapper} id="test-plan-pie-count-wrapper">
      <h3 className={styles.graphsTitle}>{t("Tests Count")}</h3>
      {isLoading && (
        <Flex align="center" justify="center" style={{ height: "100%" }}>
          <Spin size="large" />
        </Flex>
      )}
      {!isLoading && (
        <Pie
          statuses={testsFilter.statuses}
          data={data}
          type="value"
          height={height}
          onHeightChange={onHeightChange}
        />
      )}
    </div>
  )
}
