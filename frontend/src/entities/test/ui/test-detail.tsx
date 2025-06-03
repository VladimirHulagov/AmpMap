import { Flex } from "antd"
import { useTranslation } from "react-i18next"

import { Label, LabelList } from "entities/label/ui"

import { AssignTo } from "features/test-result"

import { colors } from "shared/config"
import { Attachment, AttributesObjectView, Field, FieldWithHide, Steps } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  testCase: TestCase
  showScenario?: boolean
  canChangeAssign?: boolean
  id?: string
}

export const TestDetailInfo = ({
  testCase,
  showScenario = true,
  canChangeAssign = true,
  id,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Flex vertical style={{ marginBottom: 8 }}>
      <Flex justify="space-between" style={{ marginBottom: 20 }}>
        <div style={{ marginRight: 40 }}>
          <p className={styles.listLabel}>{t("Labels")}</p>
          <LabelList showCount id={`${id}-labels`} rowCount={1} counterCls={styles.label}>
            {testCase.labels?.map(({ name, id: labelId }) => (
              <li key={labelId} data-testid={`${id}-label-item`}>
                <Label content={name} color={colors.accent} className={styles.label} />
              </li>
            ))}
          </LabelList>
        </div>
        <div style={{ minWidth: 170 }}>
          <AssignTo canChange={canChangeAssign} />
        </div>
      </Flex>
      {testCase.test_suite_description && (
        <FieldWithHide
          id={`${id}-test-suite-description`}
          title="Test Suite description"
          value={testCase.test_suite_description}
        />
      )}
      <Field
        id={`${id}-test-case-desc`}
        markdown
        title={t("Description")}
        value={testCase.description}
        showLine={false}
      />
      <Field
        id={`${id}-test-case-setup`}
        markdown
        title={t("Setup")}
        value={testCase.setup}
        showLine={false}
      />
      {showScenario &&
        (testCase.steps.length ? (
          <Steps.StepList
            id={`${id}-test-case-steps`}
            steps={testCase.steps}
            label={<p className={styles.stepsLabel}>{t("Steps")}</p>}
          />
        ) : (
          <>
            <Field
              id={`${id}-test-case-scenario`}
              markdown
              title={t("Scenario")}
              value={testCase.scenario ?? ""}
              showLine={false}
            />
            <Field
              id={`${id}-test-case-expected`}
              markdown
              title={t("Expected")}
              value={testCase.expected ?? ""}
              showLine={false}
            />
          </>
        ))}
      <Field
        id={`${id}-test-case-teardown`}
        markdown
        title="Teardown"
        value={testCase.teardown}
        showLine={false}
      />
      <Field
        id={`${id}-test-case-estimate`}
        title={t("Estimate")}
        value={testCase.estimate ?? ""}
        showLine={false}
      />
      {!!testCase.attributes && !!Object.keys(testCase.attributes).length && (
        <Field
          id={`${id}-test-case-attributes`}
          title={t("Attributes")}
          value={<AttributesObjectView attributes={testCase.attributes} />}
          showLine={false}
        />
      )}

      {!!testCase.attachments.length && (
        <Attachment.Field attachments={testCase.attachments} isDivider={false} />
      )}
    </Flex>
  )
}
