import { useState } from "react"
import { useParams } from "react-router-dom"
import { TestSuiteDetail } from "widgets"

import { TestSuiteTableWrapper } from "../test-suite-table/test-suite-table-wrapper"

export const TestSuitesView = () => {
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const [collapse, setCollapse] = useState(true)

  if (!testSuiteId) {
    return <TestSuiteTableWrapper collapse={collapse} setCollapse={setCollapse} />
  }

  return <TestSuiteDetail collapse={collapse} setCollapse={setCollapse} />
}
