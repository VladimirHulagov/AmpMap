import { Typography } from "antd"
import { useTranslation } from "react-i18next"

import { useAppSelector } from "app/hooks.ts"

import { selectOpenedResults } from "entities/result/model/slice"
import { Result } from "entities/result/ui/result/result.tsx"

import { ContainerLoader } from "shared/ui"

interface ResultListProps {
  results: Result[]
  testId: number
  testCase: TestCase
  isProjectArchive: boolean
  onActionClick: (result: Result, isClone: boolean) => void
  isFetching?: boolean
}

const NoResults = () => {
  const { t } = useTranslation()

  return (
    <div style={{ padding: 8 }} id="test-result">
      <Typography>
        <Typography.Paragraph>
          <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
            {t("No test results")}
          </Typography.Text>
        </Typography.Paragraph>
      </Typography>
    </div>
  )
}

export const ResultList = ({
  testId,
  testCase,
  isProjectArchive,
  results,
  isFetching = false,
  onActionClick,
}: ResultListProps) => {
  const openedResults = useAppSelector(selectOpenedResults)

  if (isFetching || !results) return <ContainerLoader />
  if (results.length === 0) return <NoResults />

  return (
    <div style={{ margin: "12px 0" }} id="test-result">
      {results.map((result, index) => {
        const shouldOpen = !openedResults.includes(result.id) && index === 0

        return (
          <Result
            result={result}
            testCase={testCase}
            testId={testId}
            isProjectArchive={isProjectArchive}
            key={result.id}
            isOpen={openedResults?.includes(result.id) || shouldOpen}
            onActionClick={onActionClick}
          />
        )
      })}
    </div>
  )
}
