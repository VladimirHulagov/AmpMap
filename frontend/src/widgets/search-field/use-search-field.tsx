import { useState } from "react"

export const useSearchField = () => {
  const [search, setSearch] = useState<string | undefined>(undefined)
  const [paginationParams, setPagingationParams] = useState({
    page: 1,
    page_size: 10,
  })

  const handleSearch = (value?: string) => {
    handlePagination(1, paginationParams.page_size)
    setSearch(value)
  }

  const handlePagination = (page: number, pageSize: number) => {
    setPagingationParams({ page, page_size: pageSize })
  }

  const handleLoadNextPageData = () => {
    setPagingationParams({ page: paginationParams.page + 1, page_size: paginationParams.page_size })
  }

  return {
    search,
    paginationParams,
    handleSearch,
    handlePagination,
    handleLoadNextPageData,
  }
}
