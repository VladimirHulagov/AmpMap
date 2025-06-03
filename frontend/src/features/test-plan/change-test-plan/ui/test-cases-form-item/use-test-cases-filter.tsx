import { Input, Switch, Typography } from "antd"
import { useTranslation } from "react-i18next"

import { UseFormLabelsProps } from "entities/label/model"
import { LabelWrapper } from "entities/label/ui"

import SearchIcon from "shared/assets/yi-icons/search.svg?react"

import styles from "./styles.module.css"

interface TestCasesFilterProps {
  searchText: string
  handleSearch: (value: string, labels: number[], labels_condition: LabelCondition) => Promise<void>
  selectedLables: number[]
  lableCondition: LabelCondition
  handleConditionClick: () => void
  labelProps: UseFormLabelsProps
  showArchived: boolean
  handleToggleArchived: () => void
}

export const useTestCasesFilter = ({
  labelProps,
  searchText,
  handleSearch,
  selectedLables,
  lableCondition,
  handleConditionClick,
  showArchived,
  handleToggleArchived,
}: TestCasesFilterProps) => {
  const { t } = useTranslation()

  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <Input
          placeholder={t("Search")}
          onChange={(e) => handleSearch(e.target.value, selectedLables, lableCondition)}
          value={searchText}
          data-testid="test-cases-filter-search"
          suffix={<SearchIcon width={16} height={16} style={{ transform: "scaleX(-1)" }} />}
        />
        <Switch
          defaultChecked
          className={styles.switcher}
          checked={showArchived}
          onChange={handleToggleArchived}
          style={{ width: 40, margin: 0 }}
          data-testid="test-cases-filter-switcher-archived"
        />
        <Typography.Text style={{ width: 94 }}>{t("Show Archived")}</Typography.Text>
      </div>
      <div className={styles.row}>
        <LabelWrapper labelProps={labelProps} noAdding />
        <Switch
          className={styles.switcher}
          checked={lableCondition === "and"}
          onChange={handleConditionClick}
          style={{ margin: 0 }}
          disabled={selectedLables.length < 2}
          data-testid="test-cases-filter-switcher"
        />
        <Typography.Text style={{ textTransform: "capitalize" }}>{t("and")}</Typography.Text>
      </div>
      <div className={styles.archivedRow}></div>
    </div>
  )
}
