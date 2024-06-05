import { EditOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useNavigate, useParams } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import { clearDrawerTestCase, setEditingTestCase } from "entities/test-case/model"

export const EditTestCase = ({ testCase }: { testCase: TestCase }) => {
  const { projectId, testSuiteId } = useParams<ParamProjectId | ParamTestSuiteId>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleEdit = () => {
    dispatch(clearDrawerTestCase())
    dispatch(setEditingTestCase(testCase))
    navigate(`/projects/${projectId}/suites/${testSuiteId}/edit-test-case?test_case=${testCase.id}`)
  }

  return (
    <Button id="edit-test-case-detail" icon={<EditOutlined />} onClick={handleEdit}>
      Edit
    </Button>
  )
}
