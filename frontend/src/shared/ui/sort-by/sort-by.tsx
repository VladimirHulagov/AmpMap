import { Space } from "antd"
import { Radio } from "antd"
import { Typography } from "antd"
import { Divider, Flex } from "antd"
import { useTranslation } from "react-i18next"

type OrderBy = "asc" | "desc"

interface Props extends HTMLDataAttribute {
  options: {
    value: string
    label: string
  }[]
  onChange: (value: string) => void
  defaultValue: string
  value: string
}

export const SortBy = ({ options, onChange, defaultValue, value, ...props }: Props) => {
  const { t } = useTranslation()
  const sortBy = value.replace("-", "") ?? defaultValue
  const orderBy = value.startsWith("-") ? "desc" : "asc"

  const handleFilter = (field: string) => {
    onChange(`${orderBy === "desc" ? `-${field}` : field}`)
  }

  const handleOrdering = (newOrdering: OrderBy) => {
    onChange(`${newOrdering === "desc" ? `-${sortBy}` : sortBy}`)
  }

  return (
    <Flex gap={8} vertical style={{ minWidth: 200 }}>
      <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
        <Typography.Text type="secondary" data-testid="tests-sorter-sort-by-title">
          {t("Sort by")}
        </Typography.Text>
      </Divider>
      <Radio.Group
        onChange={(newValue) => {
          handleFilter(newValue.target.value as string)
        }}
        value={sortBy}
        defaultValue={defaultValue}
        {...props}
      >
        <Space direction="vertical">
          {options.map((option, index) => (
            <Radio
              key={index}
              value={option.value}
              data-testid={`tests-sorter-sort-by-${option.value}`}
            >
              {option.label}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
      <Divider orientation="left" style={{ margin: "4px 0" }} orientationMargin={0}>
        <Typography.Text type="secondary" data-testid="tests-sorter-order-by-title">
          {t("Order by")}
        </Typography.Text>
      </Divider>
      <Radio.Group
        onChange={(newValue) => {
          handleOrdering(newValue.target.value as OrderBy)
        }}
        value={orderBy}
        data-testid="tests-sorter-order-by-group"
      >
        <Space direction="vertical">
          <Radio value="asc" data-testid="tests-sorter-order-by-asc">
            {t("Ascending")}
          </Radio>
          <Radio value="desc" data-testid="tests-sorter-order-by-desc">
            {t("Descending")}
          </Radio>
        </Space>
      </Radio.Group>
    </Flex>
  )
}
