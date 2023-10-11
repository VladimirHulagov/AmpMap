import { SearchOutlined } from "@ant-design/icons"
import { Button, Input, Space } from "antd"
import type { FilterConfirmProps, FilterDropdownProps } from "antd/es/table/interface"
import { useState } from "react"

import { colors } from "shared/config"
import { HighLighterTesty } from "shared/ui"

export const useTableSearch = () => {
  const [searchText, setSearchText] = useState("")
  const [searchedColumn, setSearchedColumn] = useState<string[]>([])

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: string
  ) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn((prevState) => [...prevState, dataIndex])
  }

  const getColumnSearch = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space style={{ display: "flex", justifyContent: "right" }}>
          <Button
            id="close-search"
            size="small"
            type="text"
            onClick={() => {
              close()
            }}
          >
            Close
          </Button>
          <Button
            id="submit-search"
            size="small"
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          >
            Search
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? colors.accent : undefined }} />
    ),
    render: (text: string) =>
      searchedColumn.some((i) => i === dataIndex) ? (
        <HighLighterTesty searchWords={searchText} textToHighlight={text} />
      ) : (
        text
      ),
  })

  return {
    setSearchText,
    getColumnSearch,
    setSearchedColumn,
    searchText,
    searchedColumn,
  }
}
