import { Select } from "antd"
import classNames from "classnames"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { colors } from "shared/config"
import { Markdown } from "shared/ui/markdown"
import { PlaceholderStatus, Status } from "shared/ui/status"

import styles from "./styles.module.css"

interface Props {
  scenario: string
  statusesOptions: StatusOption[]
  status: number | null
  expected?: string
  onChangeStatus: (status: number) => void
}

export const ScenarioStep = ({
  scenario,
  expected,
  status,
  statusesOptions,
  onChangeStatus,
}: Props) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const scenarioTextRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleToggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  const checkOverflow = () => {
    if (!scenarioTextRef.current || !containerRef.current) {
      return false
    }

    setIsOverflowing(
      scenarioTextRef.current.scrollHeight > containerRef?.current?.clientHeight || !!expected
    )
  }

  useEffect(() => {
    checkOverflow()
  }, [scenario, expected])

  return (
    <div className={classNames(styles.item, { [styles.expanded]: isExpanded })} ref={containerRef}>
      <div className={styles.resultSelect}>
        <Select
          value={status}
          placeholder={
            <div className={styles.statusWrapper}>
              <PlaceholderStatus placeholder={t("Set Status")} />
              <ArrowIcon className={styles.statusArrow} />
            </div>
          }
          className={styles.statusSelect}
          onSelect={onChangeStatus}
          labelRender={(option) => {
            return (
              <div className={styles.statusWrapper}>
                {option.label}
                <ArrowIcon className={styles.statusArrow} />
              </div>
            )
          }}
          suffixIcon={null}
          id={`create-result-scenario-statuses`}
        >
          {statusesOptions?.map((option) => (
            <Select.Option key={option.id} value={option.id}>
              <Status
                id={option.id}
                name={option.label}
                color={option.color}
                extraId={`create-result-step-${option.label}`}
              />
            </Select.Option>
          ))}
        </Select>
      </div>
      {isExpanded ? (
        <>
          <div data-testid="step-scenario">
            <Markdown content={scenario} pStyles={{ margin: 0 }} />
          </div>
          {expected && (
            <div>
              <div className={styles.expectedLabel}>{t("Expected")}</div>
              <div>
                <Markdown content={expected} pStyles={{ margin: 0 }} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.stepInfo} ref={scenarioTextRef}>
          {scenario}
        </div>
      )}
      {isOverflowing && (
        <span
          data-testid="toggle-expanding-text"
          style={{ color: colors.accent, cursor: "pointer", marginTop: 4 }}
          onClick={handleToggleExpanded}
        >
          {isExpanded ? t("Show less") : t("Show more")}
        </span>
      )}
    </div>
  )
}
