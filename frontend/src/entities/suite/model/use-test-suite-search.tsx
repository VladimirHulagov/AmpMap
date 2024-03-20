import { useState } from "react"

import { useLazyGetTestSuitesQuery } from "../api"

interface SearchProps {
  project: string
  search?: string
  page: number
  page_size: number
  is_next_page_loading?: boolean
}

export const useTestSuiteSearch = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const [activeRequest, setActiveRequest] = useState<any>(null)
  const [getSuites] = useLazyGetTestSuitesQuery()
  const [isLoading, setIsLoading] = useState(false)
  const [isLastPage, setIsLastPage] = useState(false)
  const [data, setData] = useState<Suite[]>([])

  const searchSuite = async ({
    project,
    search,
    page,
    page_size,
    is_next_page_loading = false,
  }: SearchProps) => {
    try {
      setIsLastPage(false)

      if (activeRequest) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        activeRequest.abort()
      }

      setIsLoading(true)

      const res = getSuites({
        search,
        project,
        page,
        page_size,
        is_flat: true,
      })
      setActiveRequest(res)

      const payload = await res
      if (!payload.data) {
        return
      }

      setData(is_next_page_loading ? [...data, ...payload.data.results] : payload.data.results)
      setIsLoading(false)

      if (!payload.data.pages.next) {
        setIsLastPage(true)
      }
    } catch (error) {
      // error
    }
  }

  return {
    isLoading,
    isLastPage,
    data,
    searchSuite,
  }
}
