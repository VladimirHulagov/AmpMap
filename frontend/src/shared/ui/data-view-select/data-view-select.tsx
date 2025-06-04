import { Flex, Tooltip } from "antd"
import { useTranslation } from "react-i18next"

import TreeIcon from "shared/assets/icons/tree-view.svg?react"
import TableIcon from "shared/assets/yi-icons/table.svg?react"

import { Button } from "../button"

interface Props<T> {
  value: T
  onChange: (value: T) => void
}

// eslint-disable-next-line comma-spacing
export const DataViewSelect = <T,>({ value, onChange }: Props<T>) => {
  const { t } = useTranslation()

  return (
    <Flex gap={8} data-testid="data-view-select">
      <Tooltip title={t("Table view")} placement="topLeft">
        <Button
          onClick={() => onChange("list" as T)}
          icon={<TableIcon color="var(--y-grey-30)" width={18} height={18} />}
          data-testid="data-view-select-table"
          color={value !== "list" ? "ghost" : "secondary-linear"}
          shape="square"
        />
      </Tooltip>
      <Tooltip title={t("Tree view")} placement="topLeft">
        <Button
          onClick={() => onChange("tree" as T)}
          icon={<TreeIcon color="var(--y-grey-30)" width={18} height={18} />}
          data-testid="data-view-select-tree"
          color={value !== "tree" ? "ghost" : "secondary-linear"}
          shape="square"
        />
      </Tooltip>
    </Flex>
  )
}
