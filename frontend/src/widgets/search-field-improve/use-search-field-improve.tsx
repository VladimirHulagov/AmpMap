import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"

import { LazyGetTriggerType } from "app/export-types"

interface Props<T> {
  getData: LazyGetTriggerType<T>
  searchKey: string
  dataParams?: Record<string, unknown>
  selected?: SelectData | null
  onSelect?: (dataValue?: SelectData | null) => void
}

interface Params {
  page: number
  page_size: number
  search?: string
}

interface RequestParams extends Params {
  is_search?: boolean
}

const INIT_PARAMS: Params = {
  page: 1,
  page_size: 10,
  search: undefined,
}

export const useSearchFieldImprove = <T extends BaseResponse>({
  getData,
  searchKey,
  dataParams,
  selected,
  onSelect,
}: Props<T>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const [activeRequest, setActiveRequest] = useState<any>(null)
  const [data, setData] = useState<T[]>([])
  const [stateSelected, setStateSelected] = useState<SelectData | null | undefined>(
    selected ?? null
  )
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [params, setParams] = useState<Params>(INIT_PARAMS)

  const { ref, inView } = useInView({
    threshold: 0,
    trackVisibility: true,
    delay: 100,
    skip: isLoading || isLastPage,
  })

  const fetchData = async ({ page, page_size, search, is_search = false }: RequestParams) => {
    if (activeRequest) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      activeRequest.abort()
    }

    try {
      setIsLoading(true)
      const reqParams = {
        ...dataParams,
        page,
        page_size,
      }

      if (search) {
        // @ts-ignore
        reqParams[searchKey] = search
      }

      const res = getData(reqParams)
      setActiveRequest(res)
      const { data: resData } = await res
      if (!resData) {
        return
      }

      setData((prevState) => (!is_search ? [...prevState, ...resData.results] : resData.results))
      setIsLastPage(!resData.pages.next)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!inView || isLoading || isLastPage) return
    fetchData({
      page: params.page + 1,
      page_size: params.page_size,
      search: params.search,
    })
    setParams((prevState) => ({
      ...prevState,
      page: prevState.page + 1,
      page_size: prevState.page_size,
    }))
  }, [inView, isLoading, isLastPage])

  useEffect(() => {
    setStateSelected(selected)
  }, [selected])

  const handleSearchChange = (search: string) => {
    setData([])
    setParams({ page: 1, page_size: 10, search })
    setIsLastPage(false)
    fetchData({ page: 1, page_size: 10, search, is_search: true })
  }

  const handleSelect = (select: SelectData) => {
    setStateSelected(select)
    onSelect?.(select)
  }

  const handleFocus = () => {
    fetchData({ page: 1, page_size: 10, is_search: true })
  }

  const handleBlur = () => {
    setData([])
    setIsLoading(false)
    setIsLastPage(false)
    setParams(INIT_PARAMS)
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
    triggerBottomRef: ref,
  }
}
