import { LabelField } from "entities/label/ui"

import { Attachment, Field, Steps } from "shared/ui"

interface TestCaseFieldsProps {
  testCase: TestCase
}

export const TestCaseFields = ({ testCase }: TestCaseFieldsProps) => {
  return (
    <>
      <Field id="test-case-name" title="Name" value={testCase.name} />
      <Field id="test-case-desc" markdown title="Description" value={testCase.description} />
      <Field id="test-case-setup" markdown title="Setup" value={testCase.setup} />
      {testCase.steps.length ? (
        <Steps.Field steps={[...testCase.steps].sort((a, b) => a.sort_order - b.sort_order)} />
      ) : (
        <Field id="test-case-scenario" markdown title="Scenario" value={testCase.scenario ?? ""} />
      )}
      {!testCase.steps.length && (
        <Field id="test-case-expected" markdown title="Expected" value={testCase.expected ?? ""} />
      )}
      <Field id="test-case-teardown" markdown title="Teardown" value={testCase.teardown} />
      <Field id="test-case-estimate" title="Estimate" value={testCase.estimate ?? ""} />
      {!!testCase.labels.length && <LabelField title="Labels" labels={testCase.labels} />}

      {!!testCase.attachments.length && <Attachment.Field attachments={testCase.attachments} />}
    </>
  )
}
