import { Popover, Tooltip } from "antd"
import { useTranslation } from "react-i18next"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectOrdering, updateOrdering } from "entities/test/model"

import SorterIcon from "shared/assets/yi-icons/sort.svg?react"
import { Button, SortBy } from "shared/ui"

export const TestsSorter = () => {
  const { t } = useTranslation()

  const SORTER_OPTIONS = [
    { value: "id", label: t("ID") },
    { value: "name", label: t("Name") },
    { value: "suite_path", label: t("Test Suite") },
    { value: "assignee_username", label: t("Assignee") },
    { value: "started_at", label: t("Start Date") },
    { value: "created_at", label: t("Created At") },
  ]

  const dispatch = useAppDispatch()
  const ordering = useAppSelector(selectOrdering)

  const handleOrdering = (value: string) => {
    dispatch(updateOrdering(value))
  }

  return (
    <Tooltip title={t("Sort")}>
      <Popover
        content={
          <SortBy
            options={SORTER_OPTIONS}
            onChange={handleOrdering}
            defaultValue={SORTER_OPTIONS[0].value}
            value={ordering}
            data-testid="tests-sorter-sort-by-group"
          />
        }
        arrow={false}
        trigger="click"
        placement="bottom"
      >
        <Button
          style={{ minWidth: 32 }}
          icon={<SorterIcon color="var(--y-color-secondary-inline)" width={18} height={18} />}
          data-testid="tests-sorter-button"
          color="secondary-linear"
          shape="square"
        />
      </Popover>
    </Tooltip>
  )
}
