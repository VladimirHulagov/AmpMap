import { Button, Divider, Flex, Popover, Radio, Space, Tooltip, Typography } from "antd"
import { useTranslation } from "react-i18next"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectOrdering, updateOrdering } from "entities/test-case/model"

import { icons } from "shared/assets/inner-icons"

const { SorterIcon } = icons

type OrderBy = "asc" | "desc"

export const TestCasesSorter = () => {
  const { t } = useTranslation()

  const SORTER_OPTIONS = [
    { value: "id", label: t("ID") },
    { value: "name", label: t("Name") },
    { value: "created_at", label: t("Created At") },
  ]

  const dispatch = useAppDispatch()
  const ordering = useAppSelector(selectOrdering)
  const sortBy = ordering.replace("-", "") ?? SORTER_OPTIONS[1].value
  const orderBy = ordering.startsWith("-") ? "desc" : "asc"

  const handleFilter = (field: string) => {
    dispatch(updateOrdering(`${orderBy === "desc" ? `-${field}` : field}`))
  }

  const handleOrdering = (value: OrderBy) => {
    dispatch(updateOrdering(`${value === "desc" ? `-${sortBy}` : sortBy}`))
  }

  return (
    <Tooltip title={t("Sort")}>
      <Popover
        content={
          <Flex gap={8} vertical style={{ minWidth: 200 }}>
            <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
              <Typography.Text type="secondary">{t("Sort by")}</Typography.Text>
            </Divider>
            <Radio.Group
              onChange={(value) => {
                handleFilter(value.target.value as string)
              }}
              value={sortBy ?? SORTER_OPTIONS[1].value}
              defaultValue={SORTER_OPTIONS[1].value}
            >
              <Space direction="vertical">
                {SORTER_OPTIONS.map((option, index) => (
                  <Radio key={index} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
            <Divider orientation="left" style={{ margin: "4px 0" }} orientationMargin={0}>
              <Typography.Text type="secondary">{t("Order by")}</Typography.Text>
            </Divider>
            <Radio.Group
              onChange={(value) => {
                handleOrdering(value.target.value as "asc" | "desc")
              }}
              value={orderBy}
            >
              <Space direction="vertical">
                <Radio value="asc">{t("Ascending")}</Radio>
                <Radio value="desc">{t("Descending")}</Radio>
              </Space>
            </Radio.Group>
          </Flex>
        }
        arrow={false}
        trigger="click"
        placement="bottom"
      >
        <Button style={{ minWidth: 32 }} icon={<SorterIcon color="var(--y-sky-60)" />} />
      </Popover>
    </Tooltip>
  )
}
