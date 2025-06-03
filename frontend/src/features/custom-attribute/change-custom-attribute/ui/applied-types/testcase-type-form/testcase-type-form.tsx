import { Checkbox } from "antd"
import { useTranslation } from "react-i18next"

import { useLazyGetDescendantsTreeQuery } from "entities/suite/api"

import { useProjectContext } from "pages/project"

import { EntityTreeFilter } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  value: CustomAttributeAppliedToUpdate
  onChange: (value: CustomAttributeAppliedToUpdate) => void
}

export const TestCaseTypeForm = ({ value, onChange }: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const [getSuiteTree] = useLazyGetDescendantsTreeQuery()

  const handleRequiredChange = () => {
    onChange({
      ...value,
      testcase: { ...value.testcase, is_required: !value.testcase.is_required },
    })
  }

  const handleSuiteSpecificChange = () => {
    const isSuiteSpecific = !value.testcase.is_suite_specific
    onChange({
      ...value,
      testcase: {
        ...value.testcase,
        is_suite_specific: isSuiteSpecific,
        suite_ids: !isSuiteSpecific ? [] : value.testcase.suite_ids,
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
      testcase: {
        ...value.testcase,
        suite_ids,
      },
    })
  }

  return (
    <div className={styles.wrapper}>
      <Checkbox
        data-testid="checkbox-is-required"
        className="checkbox-md"
        checked={value.testcase.is_required}
        onChange={handleRequiredChange}
      >
        {t("Required")}
      </Checkbox>
      <Checkbox
        data-testid="checkbox-suite-specific"
        className="checkbox-md"
        checked={value.testcase.is_suite_specific}
        onChange={handleSuiteSpecificChange}
      >
        {t("Suite specific")}
      </Checkbox>
      {value.testcase.is_suite_specific && (
        <EntityTreeFilter
          getData={getSuitesTreeData}
          getDataFromRoot={getSuitesTreeDataFromRoot}
          type="suites"
          value={value.testcase.suite_ids}
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
