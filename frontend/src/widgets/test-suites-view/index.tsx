import { useState } from "react"
import { useParams } from "react-router-dom"

import { TestSuiteDetail } from "entities/suite/ui/test-suite-detail"
import { TestSuiteTableWrapper } from "entities/suite/ui/test-suite-table-wrapper"

export const TestSuitesView = () => {
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const [collapse, setCollapse] = useState(true)

  if (!testSuiteId) {
    return <TestSuiteTableWrapper collapse={collapse} setCollapse={setCollapse} />
  }

  return <TestSuiteDetail collapse={collapse} setCollapse={setCollapse} />
}
