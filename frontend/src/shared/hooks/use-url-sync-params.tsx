/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import decodeUriComponent from "decode-uri-component"
import queryString from "query-string"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { config } from "shared/config"

interface Props<T> {
  params: T
  setTableParams?: React.Dispatch<React.SetStateAction<T>>
  isEnable?: boolean
  reset?: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useUrlSyncParams = <T extends Record<string, any>>({
  params,
  isEnable = true,
  setTableParams,
  reset,
}: Props<T>) => {
  const [searchParams] = useSearchParams(params)
  const navigate = useNavigate()
  const [isInit, setIsInit] = useState(false)
  const searchParamsStringify = queryString.stringify(Object.fromEntries([...searchParams]))

  useEffect(() => {
    if (isInit || !isEnable) return
    const formatSearchParams = queryString.parse(
      decodeUriComponent(searchParams.toString()),
      config.queryFormatOptions
    )
    const formatParams = queryString.stringify(params, config.queryFormatOptions)

    if (searchParamsStringify !== formatParams) {
      // @ts-ignore
      setTableParams?.(formatSearchParams)
    }
    setIsInit(true)
  }, [isEnable, isInit, searchParams, params])

  useEffect(() => {
    if (!isInit || !isEnable) return

    if (queryString.stringify(params) !== searchParamsStringify) {
      const format = queryString.stringify(params, config.queryFormatOptions)
      navigate({ search: `?${format}` }, { replace: true })
    }
  }, [isEnable, isInit, params])

  useEffect(() => {
    if (!isEnable) return
    return () => {
      reset?.()
    }
  }, [isEnable])
}
