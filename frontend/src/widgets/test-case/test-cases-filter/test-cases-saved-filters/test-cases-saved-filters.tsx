import { Flex } from "antd"
import { useMeContext } from "processes"
import { useMemo } from "react"

import { useAppDispatch, useAppSelector } from "app/hooks"

import {
  selectFilterSettings,
  testCasesFilterSchema,
  updateFilter,
  updateFilterSettings,
} from "entities/test-case/model"

import { SavedFilters } from "features/filter"

import { useProjectContext } from "pages/project"

import { queryParamsBySchema } from "shared/libs/query-params"

export const TestCasesSavedFilters = () => {
  const project = useProjectContext()
  const { userConfig } = useMeContext()
  const dispatch = useAppDispatch()
  const testCasesSelectedFilter = useAppSelector(selectFilterSettings)
  const configFilters = userConfig?.test_suites?.filters?.[project.id]

  const handleChange = (value: string) => {
    const valueFilter = configFilters?.[value]

    const filterParse = queryParamsBySchema(testCasesFilterSchema, { url: valueFilter })
    dispatch(updateFilterSettings({ selected: value }))
    dispatch(updateFilter(filterParse as Record<string, unknown>))
  }

  const configFiltersKeys = useMemo(() => {
    if (!configFilters) {
      return []
    }

    return Object.keys(configFilters)
  }, [userConfig])

  if (!configFiltersKeys.length) {
    return null
  }

  return (
    <Flex align="center">
      <SavedFilters
        options={configFiltersKeys}
        value={testCasesSelectedFilter.selected}
        onChange={handleChange}
      />
    </Flex>
  )
}
