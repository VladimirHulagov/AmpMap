import { Col, Divider } from "antd"
import { useTranslation } from "react-i18next"
import { TestPlanStatistics } from "widgets"

import { useTestPlanDetails } from "entities/test-plan/model"

import { Collapse } from "shared/ui"

import { TestDetail, TestsTable, TestsTree, TestsTreeProvider } from "widgets/tests"

import styles from "./styles.module.css"
import { TestPlanDetailAction, TestPlanDetailHeader, TestPlanDetailHeaderSkeleton } from "./ui"

export const TestPlanDetail = () => {
  const { t } = useTranslation()
  const { isLoading, testPlanId, testPlan, dataView, setDataView, refetch } = useTestPlanDetails()

  return (
    <TestsTreeProvider>
      <Col flex="1 0">
        {isLoading && (
          <>
            <TestPlanDetailHeaderSkeleton />
            <Divider />
          </>
        )}
        {!isLoading && testPlan && (
          <>
            <TestPlanDetailHeader testPlan={testPlan} refetch={refetch} />
            <Divider />
          </>
        )}
        <Collapse
          cacheKey="test-plan-statistic"
          defaultCollapse
          title={<span className={styles.collapseTitle}>{t("Statistic")}</span>}
        >
          <TestPlanStatistics testPlanId={testPlanId} />
        </Collapse>
        <Divider />
        <TestPlanDetailAction
          testPlanId={testPlanId}
          dataView={dataView}
          setDataView={setDataView}
        />
        {dataView === "list" && <TestsTable testPlanId={testPlanId} />}
        {dataView === "tree" && <TestsTree testPlanId={testPlanId} />}
        <TestDetail />
      </Col>
    </TestsTreeProvider>
  )
}
