import { FilterValue, SorterResult } from "antd/es/table/interface"
import { TablePaginationConfig } from "antd/lib"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { GetTriggerType } from "app/export-types"

import { TreeUtils } from "shared/libs"
import { addKeyToData } from "shared/libs/add-key-to-data"
import { antdSorterToTestySort } from "shared/libs/antd-sorter-to-testy-sort"

import { useDebounce } from "./use-debounce"
import { useUrlSyncParams } from "./use-url-sync-params"

interface Props<T> {
  getData: GetTriggerType<T>
  requestOptions?: Record<string, unknown>
  onRowClick?: (record: T) => string | void
  requestParams?: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sorter?: (sorter: SorterResult<any> | SorterResult<any>[]) => string
  filtersMapping?: (filters: Record<string, FilterValue | null>) => Record<string, unknown>
  searchKey?: string
  hasSearch?: boolean
  isSyncParams?: boolean
}

interface TableParamsData extends Record<string, unknown> {
  page: number
  page_size: number
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

// eslint-disable-next-line comma-spacing
export const useAntdTable = <T,>({
  getData,
  onRowClick,
  requestParams,
  requestOptions,
  sorter: customSorter,
  filtersMapping,
  searchKey = "search",
  hasSearch = true,
  isSyncParams = true,
}: Props<T>) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "")
  const searchDebounce = useDebounce(searchText, 300)
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  const getSyncParam = (key: string, defaultValue: number) =>
    isSyncParams
      ? searchParams.get(key)
        ? Number(searchParams.get(key))
        : defaultValue
      : defaultValue

  const [tableParams, setTableParams] = useState<TableParamsData>({
    ...(isSyncParams && { ...Object.fromEntries([...searchParams]) }),
    page: getSyncParam("page", DEFAULT_PAGE),
    page_size: getSyncParam("page_size", DEFAULT_PAGE_SIZE),
  })

  const tableParamsMemo = useMemo(
    () => ({
      ...tableParams,
      ...filters,
    }),
    [tableParams, filters]
  )

  useUrlSyncParams({
    isEnable: isSyncParams,
    params: tableParamsMemo,
    setTableParams,
    reset: () => {
      setTableParams({
        page: DEFAULT_PAGE,
        page_size: DEFAULT_PAGE_SIZE,
      })
      setSearchText("")
      setExpandedRowKeys([])
    },
  })

  const { data, isFetching, refetch } = getData(
    {
      ...tableParams,
      ...filters,
      ...requestParams,
    },
    requestOptions
  )

  const handleChange = <T extends unknown>(
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[]
  ) => {
    const formatSort = customSorter
      ? customSorter(sorter)
      : antdSorterToTestySort(sorter as SorterResult<unknown> | SorterResult<unknown>[])
    const params = {
      ...Object.fromEntries([...searchParams]),
      page: pagination.current ? String(pagination.current) : String(DEFAULT_PAGE),
      page_size: pagination.pageSize ? String(pagination.pageSize) : String(DEFAULT_PAGE_SIZE),
      ordering: formatSort.length ? formatSort : undefined,
    }
    const clearParams = JSON.parse(JSON.stringify(params)) as typeof params
    setTableParams({
      ...tableParams,
      ...clearParams,
      page: Number(params.page),
      page_size: Number(params.page_size),
    })

    const clearFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null))
    setFilters(filtersMapping ? filtersMapping(clearFilters) : clearFilters)
  }

  const handleRowClick = (data: T, e: React.MouseEvent<unknown, MouseEvent>) => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e?.target.attributes.href) {
      e.stopPropagation()
      return
    }

    if (onRowClick) {
      onRowClick(data)
    }
  }

  const handleRowExpand = (expandedRows: string[], recordKey: string) => {
    if (expandedRows.includes(recordKey)) {
      setExpandedRowKeys(expandedRows.filter((key) => key !== recordKey))
    } else {
      setExpandedRowKeys([...expandedRows, recordKey])
    }
  }

  const handleSearch = (searchText: string) => {
    setSearchText(searchText.trim())
    if (!searchText.trim().length) {
      setExpandedRowKeys([])
      return
    }
  }

  const handleFiltersChange = (filters: Record<string, unknown>) => {
    setFilters(filters)
    const urlParams = Object.fromEntries([...searchParams])

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = JSON.parse(
      JSON.stringify({
        ...urlParams,
        ...filters,
      })
    )

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setSearchParams(res)
  }

  const handleClearAll = () => {
    setTableParams({
      page: tableParams.page,
      page_size: tableParams.page_size,
    })
    setSearchText("")
    setSearchParams({})
    setFilters({})
  }

  useEffect(() => {
    if (!data || !searchDebounce.length) return
    const initDataWithKeys = addKeyToData(data.results as BaseData[])
    const [, expandedRows] = TreeUtils.filterRows<DataWithKey<TestPlanTreeView>>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      JSON.parse(JSON.stringify(initDataWithKeys)),
      searchDebounce,
      {
        isAllExpand: true,
        isShowChildren: false,
      }
    )

    setExpandedRowKeys(expandedRows.map((key) => String(key)))
  }, [data, searchDebounce])

  useEffect(() => {
    if (!hasSearch) return
    setTableParams((prevState) => {
      return JSON.parse(
        JSON.stringify({
          ...prevState,
          [searchKey]: searchDebounce?.length ? searchDebounce : undefined,
        })
      ) as typeof prevState
    })
  }, [searchDebounce, hasSearch])

  const handleDeleteTableParam = (keys: string[]) => {
    const newTableParams = { ...tableParams }
    keys.forEach((key) => {
      delete newTableParams[key]
    })
    setTableParams(newTableParams)
  }

  const handleAddTableParam = (key: string, value: string) => {
    setTableParams({ ...tableParams, [key]: value })
  }

  return {
    data: data?.results ?? [],
    tableParams,
    isLoading: isFetching,
    total: data?.count ?? 0,
    expandedRowKeys,
    searchText,
    filters,
    handleChange,
    handleRowClick,
    handleRowExpand,
    handleSearch,
    handleClearAll,
    handleFiltersChange,
    refetch,
    handleDeleteTableParam,
    handleAddTableParam,
  }
}
