import { EditOutlined } from "@ant-design/icons"
import { Button } from "antd"
import QS from "query-string"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import { useAppDispatch } from "app/hooks"

import { clearDrawerTestCase, setEditingTestCase } from "entities/test-case/model"

import { config } from "shared/config"
import { savePrevPageSearch } from "shared/libs/session-storage"

export const EditTestCase = ({ testCase }: { testCase: TestCase }) => {
  const { projectId, testSuiteId } = useParams<ParamProjectId | ParamTestSuiteId>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleEdit = () => {
    dispatch(clearDrawerTestCase())
    dispatch(setEditingTestCase(testCase))
    const searchParams = new URLSearchParams(location.search)
    searchParams.delete("test_case")
    const format = QS.parse(location.search, config.queryFormatOptions)
    const formatString = QS.stringify(format, config.queryFormatOptions)

    const uniqId = uuidv4()
    if (searchParams.size) {
      savePrevPageSearch(uniqId, formatString)
    }

    navigate(
      `/projects/${projectId}/suites/${testSuiteId}/edit-test-case?test_case=${testCase.id}${
        searchParams.size ? `&prevSearch=${uniqId}` : ""
      }`
    )
  }

  return (
    <Button id="edit-test-case-detail" icon={<EditOutlined />} onClick={handleEdit}>
      Edit
    </Button>
  )
}
