import { Flex } from "antd"
import classNames from "classnames"
import { ReactElement, useState } from "react"
import { Control, Controller, FieldArrayWithId } from "react-hook-form"
import { useTranslation } from "react-i18next"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { Toggle } from "shared/ui"

import {
  getBulkSuiteSpecificFieldPath,
  getSuiteSpecificFieldPath,
} from "../use-create-bulk-result-modal"
import { FieldFormItem } from "./field-form-item"
import styles from "./styles.module.css"

interface Props {
  fields: FieldArrayWithId<AddBulkResultFormData, "suite_specific", "id">[]
  bulkSpecificFields: FieldArrayWithId<AddBulkResultFormData, "bulk_suite_specific", "id">[]
  suites: { id: number; name: string; fieldsCount: number }[]
  control: Control<AddBulkResultFormData, string>
  errors: string[]
  isBulkApplying: boolean
}

export const SpecificFieldsStepBody = ({
  fields,
  suites,
  control,
  errors,
  isBulkApplying,
  bulkSpecificFields,
}: Props) => {
  const { t } = useTranslation()

  if (fields.length === 0) {
    return <div data-testid="no-suites-fields">{t("No suites fields")}</div>
  }

  return (
    <>
      <Controller
        name="is_bulk_suite_specific"
        control={control}
        render={({ field }) => {
          return (
            <Toggle
              id="apply-specific-fields-for-all-suites-toogle"
              checked={field.value}
              onChange={field.onChange}
              label={t("Set the same values for all Suites")}
              className={styles.bulkApplySuiteSpecificToggle}
              size="lg"
            />
          )
        }}
      />
      {isBulkApplying
        ? bulkSpecificFields.map((field, index) => {
            return (
              <FieldFormItem
                label={field.label}
                required={field.is_required}
                errorText={errors[index]}
                control={control}
                key={index}
                name={getBulkSuiteSpecificFieldPath(index)}
                id={`bulk-suite-specific-field-${field.label}`}
              />
            )
          })
        : suites.map((suite) => {
            return (
              <SuiteFields name={suite.name} count={suite.fieldsCount} key={suite.id}>
                {fields
                  .filter(({ suite_id }) => suite_id === suite.id)
                  .map((item) => {
                    const index = fields.findIndex(({ id }) => id === item.id)

                    const id = `suite-field-${suite.name}-${item.label}`.replace(
                      /[^a-zA-Zа-яА-Я0-9-_]/g,
                      "-"
                    )
                    return (
                      <FieldFormItem
                        label={item.label}
                        required={item.is_required}
                        errorText={errors[index]}
                        control={control}
                        key={index}
                        name={getSuiteSpecificFieldPath(index)}
                        id={id}
                      />
                    )
                  })}
              </SuiteFields>
            )
          })}
    </>
  )
}

interface SuiteFieldsProps {
  name: string
  count: number
  children: ReactElement | ReactElement[]
}

const SuiteFields = ({ name, count, children }: SuiteFieldsProps) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className={classNames({ [styles.isOpen]: isOpen })}>
      <Flex
        align="center"
        className={styles.suiteNameContainer}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <ArrowIcon
          width={24}
          height={24}
          className={styles.suiteArrow}
          data-testid={`suite-${name}-collapse-arrow`}
        />
        <span
          className={styles.suiteName}
          data-testid="suite-name-and-count"
        >{`${name} (${count})`}</span>
      </Flex>
      <div className={styles.specificFields}>{children}</div>
    </div>
  )
}
