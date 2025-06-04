import { Collapse, Flex, Space, Tag } from "antd"
import classNames from "classnames"
import dayjs from "dayjs"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { HashLink } from "react-router-hash-link"

import { useAppDispatch } from "app/hooks"

import { toggleResultVisibility } from "entities/result/model/slice"
import { TestResultComment } from "entities/result/ui/comment"

import { UserAvatar } from "entities/user/ui"

import { EditCloneResult } from "features/test-result"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { colors } from "shared/config"
import { Attachment, AttributesObjectView, Status, Steps } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  result: Result
  testCase: TestCase
  testId: number
  isProjectArchive: boolean
  isOpen: boolean
  onActionClick: (result: Result, isClone: boolean) => void
}

export const Result = memo(
  ({ result, testCase, testId, isProjectArchive, isOpen, onActionClick }: Props) => {
    const { t } = useTranslation()
    const { testPlanId } = useParams<ParamTestPlanId>()
    const dispatch = useAppDispatch()

    const resultSteps = testCase.steps
      .filter(({ id }) => result.steps_results?.some(({ step }) => step === id))
      .sort((first, second) => first.sort_order - second.sort_order)

    const resultStepStatuses: Record<number, number> = {}

    resultSteps.forEach(({ id }) => {
      const stepStatus = result.steps_results.find(({ step }) => step === id)?.status

      if (stepStatus) {
        return (resultStepStatuses[id] = stepStatus)
      }
    })

    return (
      <div
        id={`result-${result.id}`}
        className={location.hash === `#result-${result.id}` ? styles.activeHashResult : undefined}
      >
        <Collapse
          ghost
          defaultActiveKey={isOpen ? result.id : undefined}
          expandIcon={({ isActive }) => (
            <ArrowIcon
              width={24}
              height={24}
              className={classNames(styles.arrowIcon, {
                [styles.arrowIconOpen]: isActive,
              })}
              onClick={() => {
                dispatch(toggleResultVisibility(result.id))
              }}
              data-testid={`collapse-result-${result.id}`}
            />
          )}
        >
          <Collapse.Panel
            className={styles.collapsePanel}
            header={
              <Flex align="center">
                {result.status_text && (
                  <Status
                    name={result.status_text}
                    id={result.status}
                    color={result.status_color}
                  />
                )}
                <UserAvatar size={24} avatar_link={result.avatar_link} />
                <div className={styles.userName} id="test-result-username">
                  {result.user_full_name ? result.user_full_name : "-"}
                </div>
                <div className={styles.divider} />
                {result.test_case_version && (
                  <Link
                    className={styles.link}
                    to={`/projects/${result.project}/suites/${testCase.suite.id}/?test_case=${testCase.id}&version=${result.test_case_version}`}
                  >
                    {t("ver.")} {result.test_case_version}
                  </Link>
                )}
                <span>
                  <HashLink
                    className={styles.link}
                    to={`/projects/${result.project}/plans/${testPlanId}/?test=${testId}#result-${result.id}`}
                  >
                    {dayjs(result.created_at).format("YYYY-MM-DD HH:mm")}
                  </HashLink>
                </span>
                <EditCloneResult
                  isDisabled={isProjectArchive}
                  testResult={result}
                  isClone
                  onClick={onActionClick}
                  testCase={testCase}
                />
                <EditCloneResult
                  isDisabled={isProjectArchive}
                  testResult={result}
                  isClone={false}
                  onClick={onActionClick}
                  testCase={testCase}
                />
                <Space>
                  {result.is_archive ? (
                    <div>
                      <Tag color={colors.error}>{t("Archived")}</Tag>
                    </div>
                  ) : null}
                </Space>
              </Flex>
            }
            key={result.id}
          >
            <div className={styles.resultBody}>
              <TestResultComment result={result} />
              {!!resultSteps.length && (
                <Steps.StepList
                  id={`result-steps-${result.id}`}
                  steps={resultSteps}
                  stepStatuses={resultStepStatuses}
                  label={<div className={styles.stepsLabel}>{t("Steps")}</div>}
                  project={testCase.project}
                />
              )}
              <AttributesObjectView attributes={result.attributes} />
              {!!result.attachments.length && <Attachment.Field attachments={result.attachments} />}
            </div>
          </Collapse.Panel>
        </Collapse>
      </div>
    )
  }
)

Result.displayName = "Result"
