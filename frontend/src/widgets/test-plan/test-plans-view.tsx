import { useState } from "react"
import { useParams } from "react-router-dom"

import { TestPlanDetail } from "./test-plan-detail"
import { TestPlanTableWrapper } from "./test-plan-table/test-plan-table-wrapper"

export const TestPlansView = () => {
  const { testPlanId } = useParams<ParamTestPlanId>()
  const [collapse, setCollapse] = useState(true)

  if (!testPlanId) {
    return <TestPlanTableWrapper collapse={collapse} setCollapse={setCollapse} />
  }

  return <TestPlanDetail collapse={collapse} setCollapse={setCollapse} />
}
