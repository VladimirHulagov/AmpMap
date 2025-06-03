import { Checkbox, Form, Select } from "antd"
import { useStatuses } from "entities/status/model/use-statuses"
import { useTranslation } from "react-i18next"

import { useLazyGetDescendantsTreeQuery } from "entities/suite/api"

import { useProjectContext } from "pages/project"

import { EntityTreeFilter, Status } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  value: CustomAttributeAppliedToUpdate
  onChange: (value: CustomAttributeAppliedToUpdate) => void
}

export const TestResultTypeForm = ({ value, onChange }: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const [getSuiteTree] = useLazyGetDescendantsTreeQuery()

  const { statuses } = useStatuses({ project: project.id })

  const handleStatusChange = (selectValue: number[]) => {
    onChange({ ...value, testresult: { ...value.testresult, status_specific: selectValue } })
  }

  const handleRequiredChange = () => {
    onChange({
      ...value,
      testresult: { ...value.testresult, is_required: !value.testresult.is_required },
    })
  }

  const handleSuiteSpecificChange = () => {
    const isSuiteSpecific = !value.testresult.is_suite_specific
    onChange({
      ...value,
      testresult: {
        ...value.testresult,
        is_suite_specific: isSuiteSpecific,
        suite_ids: !isSuiteSpecific ? [] : value.testresult.suite_ids,
      },
    })
  }

  const getSuitesTreeData = () => {
    return getSuiteTree({ parent: null, project: project.id }, true).unwrap()
  }

  const getSuitesTreeDataFromRoot = () => {
    return getSuiteTree({ project: project.id, parent: null }).unwrap()
  }

  const handleChange = (suite_ids: number[]) => {
    onChange({
      ...value,
      testresult: {
        ...value.testresult,
        suite_ids,
      },
    })
  }

  return (
    <div className={styles.wrapper}>
      <Form.Item label={t("Result Status")} style={{ marginBottom: 0 }}>
        <Select
          id="select-status"
          placeholder={t("Please select")}
          mode="multiple"
          allowClear
          showSearch={false}
          value={value.testresult.status_specific}
          onChange={handleStatusChange}
          className={styles.selectStatus}
        >
          {statuses.map((status) => (
            <Select.Option key={status.id} value={status.id}>
              <Status id={status.id} name={status.name} color={status.color} />
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Checkbox
        data-testid="checkbox-is-required"
        className="checkbox-md"
        checked={value.testresult.is_required}
        onChange={handleRequiredChange}
      >
        {t("Required")}
      </Checkbox>
      <Checkbox
        data-testid="checkbox-suite-specific"
        className="checkbox-md"
        checked={value.testresult.is_suite_specific}
        onChange={handleSuiteSpecificChange}
      >
        {t("Suite specific")}
      </Checkbox>
      {value.testresult.is_suite_specific && (
        <EntityTreeFilter
          getData={getSuitesTreeData}
          getDataFromRoot={getSuitesTreeDataFromRoot}
          type="suites"
          value={value.testresult.suite_ids}
          onChange={handleChange}
          onClear={() => {
            handleChange([])
          }}
          showFullOnly
        />
      )}
    </div>
  )
}
