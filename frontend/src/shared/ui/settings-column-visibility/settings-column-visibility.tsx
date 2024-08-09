import { TableOutlined } from "@ant-design/icons"
import { Button, Checkbox, Popover } from "antd"
import { CheckboxValueType } from "antd/es/checkbox/Group"
import { ColumnsType } from "antd/es/table"
import { memo, useEffect, useState } from "react"

import { useUserConfig } from "entities/user/model"

interface Props {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnsType<any>
  visibilityColumns?: string[]
  onChange?: (data: string[]) => void
}

const SettingsColumnVisibilityComponent = ({
  columns,
  id,
  visibilityColumns: stateVisibilityColumns,
  onChange,
}: Props) => {
  const { userConfig, updateConfig } = useUserConfig()
  const names = columns.filter((column) => !!column.title).map((column) => column.title) as string[]
  const [visibilityColumns, setVisibilityColumns] = useState(stateVisibilityColumns ?? names)
  const [isOnce, setIsOnce] = useState(false)

  const handleChange = (data: CheckboxValueType[]) => {
    onChange?.(data as string[])
    setVisibilityColumns(data as string[])
    updateConfig({
      test_plans: {
        ...userConfig.test_plans,
        shown_columns: data as string[],
      },
    })
  }

  useEffect(() => {
    if (!isOnce && names.length) {
      const cols = userConfig.test_plans.shown_columns ?? names
      onChange?.(cols)
      setVisibilityColumns(cols)
      setIsOnce(true)
    }
  }, [userConfig, isOnce, names])

  return (
    <Popover
      content={<Checkbox.Group options={names} value={visibilityColumns} onChange={handleChange} />}
      title="Shown columns"
      trigger="click"
      placement="bottomRight"
    >
      <Button id={id} icon={<TableOutlined />} />
    </Popover>
  )
}

export const SettingsColumnVisibility = memo(SettingsColumnVisibilityComponent)
