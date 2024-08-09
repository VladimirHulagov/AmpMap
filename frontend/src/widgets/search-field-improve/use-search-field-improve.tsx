import { useState } from "react"

import { LazyGetTriggerType } from "app/export-types"

import { useOnViewLoad } from "shared/hooks/use-on-view-load"

interface Props<T> {
  getData: LazyGetTriggerType<T>
  searchKey: string
  dataParams?: Record<string, unknown>
  selected?: SelectData | null
  onSelect?: (dataValue?: SelectData | null) => void
}

export const useSearchFieldImprove = <T extends BaseResponse>({
  getData,
  searchKey,
  dataParams,
  selected,
  onSelect,
}: Props<T>) => {
  const [stateSelected, setStateSelected] = useState<SelectData | null | undefined>(
    selected ?? null
  )

  const { data, reset, fetchData, handleSearchChange, isLastPage, isLoading, iref } = useOnViewLoad(
    {
      getData,
      searchKey,
      dataParams,
    }
  )

  const handleSelect = (select: SelectData) => {
    setStateSelected(select)
    onSelect?.(select)
  }

  const handleFocus = () => {
    fetchData({ page: 1, page_size: 10, is_search: true })
  }

  const handleBlur = () => {
    reset()
  }

  return {
    data,
    stateSelected,
    isLastPage,
    isLoading,
    handleFocus,
    handleBlur,
    handleSelect,
    handleSearchChange,
    triggerBottomRef: iref,
  }
}
