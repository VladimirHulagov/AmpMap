import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import QS from "query-string"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import { config } from "shared/config"
import { savePrevPageSearch } from "shared/libs/session-storage"

export const CreateTestCase = () => {
  const { projectId, testSuiteId } = useParams<ParamProjectId | ParamTestSuiteId>()
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    const searchParams = new URLSearchParams(location.search)
    const format = QS.parse(location.search, config.queryFormatOptions)
    const formatString = QS.stringify(format, config.queryFormatOptions)

    const uniqId = uuidv4()
    if (searchParams.size) {
      savePrevPageSearch(uniqId, formatString)
    }
    let url = `/projects/${projectId}/suites/${testSuiteId}/new-test-case`
    if (searchParams.size) {
      url += `?prevSearch=${uniqId}`
    }
    navigate(url)
  }

  return (
    <Button id="create-test-case" type="primary" icon={<PlusOutlined />} onClick={handleClick}>
      Create Test Case
    </Button>
  )
}
