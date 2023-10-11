import { Content } from "antd/lib/layout/layout"

import { TestPlanActivityWrapper } from "entities/test-plan/ui/test-plan-activity"

export const TestPlanActivityPage = () => {
  return (
    <Content>
      <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
        <TestPlanActivityWrapper />
      </div>
    </Content>
  )
}
