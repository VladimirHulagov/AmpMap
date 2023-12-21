import { useState } from "react"
import { useParams } from "react-router-dom"

import { TestPlanTableWrapper } from "entities/test-plan/ui"

import { TestPlanDetail } from "./test-plan-detail"

export const TestPlansView = () => {
  const { testPlanId } = useParams<ParamTestPlanId>()
  const [collapse, setCollapse] = useState(true)

  if (!testPlanId) {
    return <TestPlanTableWrapper collapse={collapse} setCollapse={setCollapse} />
  }

  return <TestPlanDetail collapse={collapse} setCollapse={setCollapse} />
}
