import { EditOutlined } from "@ant-design/icons"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import { clearDrawerTestCase } from "entities/test-case/model"

import { Button } from "shared/ui"

interface Props {
  testCase: TestCase
}

export const EditTestCase = ({ testCase }: Props) => {
  const { t } = useTranslation()
  const { projectId } = useParams<ParamProjectId | ParamTestSuiteId>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleEdit = () => {
    dispatch(clearDrawerTestCase())

    const url = new URL(
      `${window.location.origin}/projects/${projectId}/suites/edit-test-case?test_case=${testCase.id}`
    )
    const currentSearchParams = new URLSearchParams(window.location.search)

    url.searchParams.append(
      "prevUrl",
      !currentSearchParams.get("prevUrl")
        ? `${window.location.pathname}${window.location.search}`
        : (currentSearchParams.get("prevUrl") ?? "")
    )

    navigate(`${url.pathname}${url.search}`)
  }

  return (
    <Button
      id="edit-test-case-detail"
      icon={<EditOutlined />}
      onClick={handleEdit}
      color="secondary-linear"
    >
      {t("Edit")}
    </Button>
  )
}
