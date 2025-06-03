import { useTranslation } from "react-i18next"

import { Markdown } from "shared/ui"

interface Props {
  result: Result
}

export const TestResultComment = ({ result }: Props) => {
  const { t } = useTranslation()
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}> {t("Comment")}</div>
      <div className="content" id="test-result-comment">
        <Markdown
          content={result.comment ? result.comment : t("No Comment")}
          pStyles={{ margin: 0 }}
        />
      </div>
    </div>
  )
}
