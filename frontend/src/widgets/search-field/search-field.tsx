import { Select, Spin } from "antd"
import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"

interface WorkData {
  id: number
  name: string
}

interface Props<T = WorkData> {
  isLoading: boolean
  isLastPage: boolean
  placeholder?: string
  select?: SelectData | null
  data?: T[]
  valueKey?: "name" | "title"
  onSearch?: (value: string) => void
  onChange?: (dataValue?: SelectData) => void
  onClear?: () => void
  handleLoadNextPageData?: () => void
}

export const SearchField = <T extends WorkData>({
  data,
  placeholder,
  isLoading,
  isLastPage,
  select,
  valueKey = "name",
  onChange,
  onSearch,
  onClear,
  handleLoadNextPageData,
}: Props<T>) => {
  const [selectState, setSelectState] = useState<SelectData | null | undefined>(select ?? null)
  const { ref, inView } = useInView()

  const handleClearParent = () => {
    if (onClear) {
      onClear()
    }
  }

  const handleSearch = (newValue: string) => {
    if (!newValue.length) {
      if (onSearch) {
        onSearch("")
      }
      return
    }

    if (onSearch) {
      onSearch(newValue)
    }
  }

  const handleChange = (dataValue?: SelectData) => {
    if (!dataValue) {
      handleClearParent()
      return
    }

    setSelectState(dataValue)

    if (onChange) {
      onChange(dataValue)
    }
  }

  const handleFocusSearch = () => {
    if (onSearch) {
      onSearch("")
    }
  }

  useEffect(() => {
    if (!inView || isLoading || !handleLoadNextPageData) return
    handleLoadNextPageData()
  }, [inView, isLoading])

  useEffect(() => {
    setSelectState(select)
  }, [select])

  return (
    <Select
      id="search-field"
      value={selectState}
      showSearch
      labelInValue
      placeholder={placeholder}
      defaultActiveFirstOption={false}
      showArrow
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      onFocus={handleFocusSearch}
      notFoundContent="No matches"
      allowClear
      style={{ width: "100%" }}
    >
      {data?.map((item) => (
        <Select.Option key={item.id} value={item.id}>
          {/* @ts-ignore */}
          {item[valueKey]}
        </Select.Option>
      ))}
      {isLoading && (
        <Select.Option value="">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Spin />
          </div>
        </Select.Option>
      )}
      {data?.length && !isLastPage && !isLoading && (
        <Select.Option value="">
          <div ref={ref} />
        </Select.Option>
      )}
    </Select>
  )
}
