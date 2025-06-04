import { PlusOutlined } from "@ant-design/icons"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "shared/ui"

interface Props {
  as?: ReactNode
  loading?: boolean
  parentSuite?: Suite
}

export const CreateTestCase = ({ as, loading = false, parentSuite }: Props) => {
  const { t } = useTranslation()
  const { projectId } = useParams<ParamProjectId | ParamTestSuiteId>()
  const navigate = useNavigate()

  const handleClick = () => {
    const url = new URL(`${window.location.origin}/projects/${projectId}/suites/new-test-case`)
    const currentSearchParams = new URLSearchParams(window.location.search)

    if (parentSuite && !loading) {
      url.searchParams.append("suiteId", String(parentSuite.id))
    }

    url.searchParams.append(
      "prevUrl",
      !currentSearchParams.get("prevUrl")
        ? `${window.location.pathname}${window.location.search}`
        : (currentSearchParams.get("prevUrl") ?? "")
    )

    navigate(`${url.pathname}${url.search}`, { state: { suite: parentSuite } })
  }

  if (as) {
    return (
      <div id="create-test-case" onClick={handleClick}>
        {as}
      </div>
    )
  }

  return (
    <Button
      id="create-test-case"
      icon={<PlusOutlined />}
      onClick={handleClick}
      disabled={loading}
      loading={loading}
    >
      {t("Create")} {t("Test Case")}
    </Button>
  )
}
