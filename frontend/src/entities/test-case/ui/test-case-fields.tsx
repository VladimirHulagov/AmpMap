import { Flex } from "antd"
import { useTranslation } from "react-i18next"

import { Label, LabelList } from "entities/label/ui"

import { colors } from "shared/config"
import { Attachment, AttributesObjectView, Field, FieldWithHide, Steps } from "shared/ui"

import styles from "./styles.module.css"

interface TestCaseFieldsProps {
  testCase: TestCase
}

export const TestCaseFields = ({ testCase }: TestCaseFieldsProps) => {
  const { t } = useTranslation()
  return (
    <Flex vertical gap={10}>
      {!!testCase.labels.length && (
        <div style={{ marginBottom: 8 }}>
          <div className={styles.listLabel}>{t("Labels")}</div>
          <LabelList showCount id="test-case-labels" rowCount={2} counterCls={styles.label}>
            {testCase.labels.map(({ name, id }) => (
              <li key={id} data-testid={`${id}-label-item`}>
                <Label content={name} color={colors.accent} className={styles.label} />
              </li>
            ))}
          </LabelList>
        </div>
      )}
      {testCase.test_suite_description && (
        <FieldWithHide
          id="test-suite-description"
          title="Test Suite description"
          value={testCase.test_suite_description}
          showLine={false}
        />
      )}
      <Field
        id="test-case-desc"
        markdown
        title={t("Description")}
        value={testCase.description}
        showLine={false}
      />
      <Field
        id="test-case-setup"
        markdown
        title={t("Setup")}
        value={testCase.setup}
        showLine={false}
      />
      {testCase.steps.length ? (
        <Steps.StepList
          steps={[...testCase.steps].sort((a, b) => a.sort_order - b.sort_order)}
          label={<p className={styles.stepsLabel}>{t("Steps")}</p>}
          id="test-case-detail"
        />
      ) : (
        <Field
          id="test-case-scenario"
          markdown
          title={t("Scenario")}
          value={testCase.scenario ?? ""}
          showLine={false}
        />
      )}
      {!testCase.steps.length && (
        <Field
          id="test-case-expected"
          markdown
          title={t("Expected")}
          value={testCase.expected ?? ""}
          showLine={false}
        />
      )}
      <Field
        id="test-case-teardown"
        markdown
        title="Teardown"
        value={testCase.teardown}
        showLine={false}
      />
      <Field
        id="test-case-estimate"
        title={t("Estimate")}
        value={testCase.estimate ?? ""}
        showLine={false}
      />
      {!!testCase.attributes && !!Object.keys(testCase.attributes).length && (
        <Field
          id="test-case-attributes"
          title={t("Attributes")}
          showLine={false}
          value={<AttributesObjectView attributes={testCase.attributes} />}
        />
      )}

      {!!testCase.attachments.length && <Attachment.Field attachments={testCase.attachments} />}
    </Flex>
  )
}
