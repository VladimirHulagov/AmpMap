import { Select, Spin } from "antd"

import { LazyGetTriggerType } from "app/export-types"

import { useSearchFieldImprove } from "."

interface Props<T> {
  id?: string
  getData: LazyGetTriggerType<T>
  searchKey: string
  selected?: SelectData | null
  placeholder?: string
  select?: SelectData | null
  valueKey?: "name" | "title"
  onSelect?: (dataValue?: SelectData | null) => void
  onClear?: () => void
  dataParams?: Record<string, unknown>
  disabled?: boolean
}

export const SearchFieldImprove = <T extends BaseResponse>({
  id = "search-field",
  searchKey,
  selected,
  placeholder,
  valueKey = "name",
  getData,
  dataParams,
  onSelect,
  onClear,
  disabled = false,
}: Props<T>) => {
  const {
    data,
    isLastPage,
    isLoading,
    handleSelect,
    handleFocus,
    handleBlur,
    handleSearchChange,
    triggerBottomRef,
  } = useSearchFieldImprove<T>({ getData, onSelect, selected, searchKey, dataParams })

  return (
    <Select
      id={id}
      value={selected ?? undefined}
      showSearch
      labelInValue
      placeholder={placeholder}
      defaultActiveFirstOption={false}
      filterOption={false}
      onSearch={handleSearchChange}
      onChange={handleSelect}
      onClear={onClear}
      onFocus={handleFocus}
      onBlur={handleBlur}
      notFoundContent="No matches"
      allowClear
      style={{ width: "100%" }}
      disabled={disabled}
    >
      {data?.map((item) => (
        <Select.Option key={item.id} value={item.id}>
          {/* @ts-ignore */}
          {item[valueKey]}
        </Select.Option>
      ))}
      {isLoading && (
        <Select.Option value="">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              userSelect: "none",
            }}
          >
            <Spin />
          </div>
        </Select.Option>
      )}
      {data?.length && !isLastPage && !isLoading && (
        <Select.Option value="">
          <div ref={triggerBottomRef} />
        </Select.Option>
      )}
    </Select>
  )
}
