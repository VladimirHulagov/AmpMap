import { Space, Tag, Typography } from "antd"
import { EditResult } from "features/test-result"
import moment from "moment"
import { useEffect } from "react"
import { Link, useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { useLazyGetResultsQuery } from "entities/result/api"

import { selectArchivedResultsIsShow } from "entities/test-plan/model"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { colors } from "shared/config"
import { Attachment, ContainerLoader, Status } from "shared/ui"

import { TestResultAttributes } from "../attributes"
import { TestResultComment } from "../comment"
import { TestResultSteps } from "../steps"
import styles from "./styles.module.css"

interface ResultListProps {
  testId: number
  testCase: ITestCase
  isProjectArchive: boolean
}

const NoResults = () => {
  return (
    <div style={{ padding: 8 }} id="test-result">
      <Typography>
        <Typography.Paragraph>
          <Typography.Text style={{ whiteSpace: "pre-wrap" }}>No test results</Typography.Text>
        </Typography.Paragraph>
      </Typography>
    </div>
  )
}

export const ResultList = ({ testId, testCase, isProjectArchive }: ResultListProps) => {
  const [getResults, { data: results, isLoading }] = useLazyGetResultsQuery()
  const showArchive = useAppSelector(selectArchivedResultsIsShow)
  const { projectId } = useParams<ParamProjectId>()

  useEffect(() => {
    getResults({ testId: String(testId), showArchive, project: projectId || "" })
  }, [testId, showArchive])

  if (isLoading || !results) return <ContainerLoader />
  if (results.length === 0) return <NoResults />

  return (
    <div className={styles.resultList} id="test-result">
      {results.map((result) => (
        <div key={result.id} className={styles.resultListItem}>
          <div className={styles.resultListHeader}>
            <div className={styles.resultListHeaderBase}>
              <Space>
                <UserAvatar size={32} avatar_link={result.avatar_link} />
                <p style={{ margin: 0, fontWeight: 500 }} id="test-result-username">
                  {result.user_full_name ? result.user_full_name : "-"}
                </p>
              </Space>
            </div>
            <Space>
              {result.is_archive ? (
                <div>
                  <Tag color={colors.error}>Archived</Tag>
                </div>
              ) : null}
              <div className={styles.resultListHeaderStatus}>
                <Status value={result.status_text} />
              </div>
            </Space>
          </div>
          <div className={styles.resultListBody}>
            <TestResultComment result={result} />
            {!!result.steps_results.length && (
              <TestResultSteps stepsResult={result.steps_results} />
            )}
            <TestResultAttributes attributes={result.attributes} />
            {!!result.attachments.length && <Attachment.Field attachments={result.attachments} />}
          </div>
          <div className={styles.resultListFooter}>
            <span style={{ margin: 0 }}>
              {moment(result.created_at).format("LLL")} |{" "}
              {result.test_case_version && (
                <Link
                  style={{ color: "#999999", fontSize: 14, textDecoration: "underline" }}
                  to={`/projects/${result.project}/suites/${testCase.suite}/?test_case=${testCase.id}&version=${result.test_case_version}`}
                >
                  ver. {result.test_case_version}
                </Link>
              )}
            </span>
            <EditResult isDisabled={isProjectArchive} testCase={testCase} testResult={result} />
          </div>
        </div>
      ))}
    </div>
  )
}
