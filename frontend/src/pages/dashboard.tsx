import { Card, Layout, Row } from "antd"
import { useContext, useEffect } from "react"
import { MenuContext } from "widgets"

import { useGetSystemStatsQuery } from "entities/system/api"

import { StatisticEntityInfo } from "shared/ui"

import { ProjectCards } from "widgets/project/ui/project-cards/project-cards"

const { Content } = Layout

export const DashboardPage = () => {
  const { setActiveMenu } = useContext(MenuContext)!
  const { data } = useGetSystemStatsQuery()

  useEffect(() => {
    setActiveMenu(["dashboard"])
  }, [])

  return (
    <Content style={{ margin: 20 }}>
      <Card style={{ marginBottom: 20 }} bodyStyle={{ padding: 12 }}>
        <Row align="middle" justify="space-around">
          <StatisticEntityInfo title="Projects" count={data?.projects_count ?? 0} />
          <StatisticEntityInfo title="Test Suites" count={data?.suites_count ?? 0} />
          <StatisticEntityInfo title="Test Cases" count={data?.cases_count ?? 0} />
          <StatisticEntityInfo title="Test Plans" count={data?.plans_count ?? 0} />
          <StatisticEntityInfo title="Tests" count={data?.tests_count ?? 0} />
        </Row>
      </Card>
      <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
        <ProjectCards />
      </div>
    </Content>
  )
}
