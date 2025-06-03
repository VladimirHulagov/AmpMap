import { AlignLeftOutlined, BarChartOutlined, PieChartOutlined } from "@ant-design/icons"
import { Button, Divider, Flex, Row } from "antd"
import { useMeContext } from "processes"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TestPlanDataActions, TestPlanStatistics } from "widgets"

import { useTestPlanStatistics } from "entities/test-plan/model"
import { TestPlanStatisticsProvider } from "entities/test-plan/model/test-plan-statistics-context"

import { useCacheState } from "shared/hooks"
import { toBool } from "shared/libs"
import { Collapse, Markdown } from "shared/ui"

import { TestDetail, TestsTable, TestsTree } from "widgets/tests"

import { useTestPlanContext } from "../test-plan-layout/test-plan-layout"
import styles from "./styles.module.css"

const CACHE_COLLAPSE_KEY = "collapse-test-plan-statistic"

export const TestPlansOverviewTab = () => {
  const { t } = useTranslation()
  const { userConfig, updateConfig } = useMeContext()
  const [dataView, setDataView] = useCacheState<EntityView>("test-plan-detail-tests-view", "tree")
  const { testPlan, hasTestPlan, isFetching } = useTestPlanContext()
  const statistics = useTestPlanStatistics({ testPlanId: testPlan?.id, view: dataView })
  const [segment, setSegment] = useState<GraphBaseType>(userConfig?.ui?.graph_base_type ?? "pie")
  const [isCollapse, setIsCollapse] = useCacheState(CACHE_COLLAPSE_KEY, false, toBool)

  const handleSegmentedChange = async (value: GraphBaseType) => {
    setSegment(value)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig?.ui,
        graph_base_type: value,
      },
    })
  }

  return (
    <TestPlanStatisticsProvider value={statistics}>
      <Flex vertical style={{ width: "100%" }}>
        {hasTestPlan && testPlan?.description && (
          <>
            <Collapse
              cacheKey="test-plan-description"
              defaultCollapse={false}
              title={<span className={styles.collapseTitle}>{t("Description")}</span>}
              data-testid="test-plan-description-collapse"
            >
              <div data-testid="test-plan-description">
                <Markdown content={testPlan.description} />
              </div>
            </Collapse>
            <Divider />
          </>
        )}
        <Collapse
          cacheKey={CACHE_COLLAPSE_KEY}
          defaultCollapse={isCollapse}
          onOpenChange={setIsCollapse}
          collapse={isCollapse}
          title={
            <Flex align="middle" justify="space-between" style={{ width: "100%", minHeight: 32 }}>
              <span data-testid="test-plan-statistic-title" className={styles.collapseTitle}>
                {t("Statistic")}
              </span>
              {!isCollapse && (
                <Row align="middle" justify="end">
                  <Button
                    id="test-plan-statistic-overview"
                    icon={<PieChartOutlined width={16} height={16} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSegmentedChange("pie")
                    }}
                    type={segment === "pie" ? "default" : "text"}
                    data-testid="test-plan-statistic-overview"
                  >
                    {t("Overview")}
                  </Button>
                  <Button
                    id="test-plan-statistic-histogram"
                    icon={<BarChartOutlined width={16} height={16} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSegmentedChange("bar")
                    }}
                    type={segment === "bar" ? "default" : "text"}
                    data-testid="test-plan-statistic-histogram"
                  >
                    {t("Histogram")}
                  </Button>
                  <Button
                    id="test-plan-statistic-child-plans"
                    icon={<AlignLeftOutlined width={16} height={16} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSegmentedChange("child")
                    }}
                    type={segment === "child" ? "default" : "text"}
                    data-testid="test-plan-statistic-child-plans"
                  >
                    {t("Child Plans")}
                  </Button>
                </Row>
              )}
            </Flex>
          }
          titleProps={{ style: { marginBottom: 20 } }}
        >
          <TestPlanStatistics testPlanId={testPlan?.id} segment={segment} />
        </Collapse>
        <Divider />
        <TestPlanDataActions
          testPlanId={testPlan?.id}
          dataView={dataView}
          setDataView={setDataView}
        />
        {dataView === "list" && !isFetching && <TestsTable testPlanId={testPlan?.id} />}
        {dataView === "tree" && !isFetching && <TestsTree testPlanId={testPlan?.id} />}
        <TestDetail />
      </Flex>
    </TestPlanStatisticsProvider>
  )
}
