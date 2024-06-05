import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useNavigate, useParams } from "react-router-dom"

export const CreateTestCase = () => {
  const { projectId, testSuiteId } = useParams<ParamProjectId | ParamTestSuiteId>()
  const navigate = useNavigate()

  return (
    <Button
      id="create-test-case"
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => {
        navigate(`/projects/${projectId}/suites/${testSuiteId}/new-test-case`)
      }}
    >
      Create Test Case
    </Button>
  )
}
