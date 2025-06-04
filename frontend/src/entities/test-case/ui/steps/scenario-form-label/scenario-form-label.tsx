import { Flex } from "antd"
import { useTranslation } from "react-i18next"

import CollapseIcon from "shared/assets/yi-icons/collapse-3.svg?react"
import ExpandIcon from "shared/assets/yi-icons/expand-2.svg?react"
import { Toggle } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  type: "create" | "edit"
  isSteps: boolean
  onIsStepsChange: (toggle: boolean) => void
  onCollapse?: () => void
  onExpand?: () => void
}

export const ScenarioFormLabel = ({
  type,
  isSteps,
  onCollapse,
  onExpand,
  onIsStepsChange,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Flex
      style={{ width: "100%", userSelect: "none" }}
      align="center"
      justify="space-between"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <span style={{ marginRight: 16 }}>{t("Scenario")}</span>
      {isSteps && (
        <>
          <Flex
            align="center"
            onClick={onExpand}
            className={styles.labelButton}
            data-testid={`${type}-expand-steps`}
          >
            <ExpandIcon width={16} height={16} />
            {t("Expand")}
          </Flex>
          <Flex
            align="center"
            onClick={onCollapse}
            className={styles.labelButton}
            data-testid={`${type}-collapse-steps`}
          >
            <CollapseIcon width={16} height={16} />
            {t("Collapse")}
          </Flex>
          <div className={styles.line} />
        </>
      )}
      <Toggle
        id="edit-steps-toggle"
        label={t("Steps")}
        checked={isSteps}
        onChange={onIsStepsChange}
        size="sm"
      />
    </Flex>
  )
}
