import { FilterFilled, FilterOutlined } from "@ant-design/icons"
import { Switch, Typography } from "antd"
import Search from "antd/lib/input/Search"
import cn from "classnames"
import { useEffect, useState } from "react"

import { UseFormLabelsProps } from "entities/label/model"
import { LabelWrapper } from "entities/label/ui"

import { useUserConfig } from "entities/user/model"

import styles from "./styles.module.css"

interface TestCasesFilterProps {
  searchText: string
  handleSearch: (value: string, labels: number[], labels_condition: "and" | "or") => Promise<void>
  selectedLables: number[]
  lableCondition: "and" | "or"
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
  const { userConfig, updateConfig } = useUserConfig()
  const [isShow, setIsShow] = useState(userConfig?.test_plans.is_cases_filter_open ?? false)

  const handleClick = () => {
    setIsShow(!isShow)
  }

  useEffect(() => {
    updateConfig({ test_plans: { ...userConfig.test_plans, is_cases_filter_open: isShow } })
  }, [isShow])

  const FilterBtn = (
    <div id="test-cases-filter-btn" onClick={handleClick} className={styles.filterBtn}>
      {isShow ? <FilterFilled /> : <FilterOutlined />}
    </div>
  )

  const Form = isShow && (
    <div className={styles.form}>
      <div className={styles.row}>
        <Typography.Text>Name</Typography.Text>
        <Search
          placeholder="Search"
          onChange={(e) => handleSearch(e.target.value, selectedLables, lableCondition)}
          value={searchText}
          className={styles.search}
        />
      </div>
      <div className={cn(styles.row, styles.rowWithThree)}>
        <Typography.Text>Labels</Typography.Text>
        <LabelWrapper labelProps={labelProps} noAdding />
        <Switch
          checkedChildren="or"
          unCheckedChildren="and"
          defaultChecked
          className={styles.switcher}
          checked={lableCondition === "or"}
          onChange={handleConditionClick}
          disabled={selectedLables.length < 2}
        />
      </div>
      <div className={styles.archivedRow}>
        <Typography.Text>Show archived</Typography.Text>
        <Switch
          checkedChildren="yes"
          unCheckedChildren="no"
          defaultChecked
          className={styles.switcher}
          checked={showArchived}
          onChange={handleToggleArchived}
        />
      </div>
    </div>
  )

  return {
    FilterButton: FilterBtn,
    FilterForm: Form,
  }
}
