import { Flex } from "antd"
import { useMeContext } from "processes"
import { useMemo } from "react"

import { useAppDispatch, useAppSelector } from "app/hooks"

import {
  selectFilterSettings,
  testFilterSchema,
  updateFilter,
  updateFilterSettings,
} from "entities/test/model"

import { SavedFilters } from "features/filter"

import { useProjectContext } from "pages/project"

import { queryParamsBySchema } from "shared/libs/query-params"

interface Props {
  resetSelectedRows: () => void
}

export const TestsSavedFilters = ({ resetSelectedRows }: Props) => {
  const project = useProjectContext()
  const { userConfig } = useMeContext()
  const dispatch = useAppDispatch()
  const testsSelectedFilter = useAppSelector(selectFilterSettings)

  const configFilters = userConfig?.test_plans?.filters?.[project.id]

  const handleChange = (value: string) => {
    const valueFilter = configFilters?.[value]

    const filterParse = queryParamsBySchema(testFilterSchema, { url: valueFilter })
    resetSelectedRows()
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
        value={testsSelectedFilter.selected}
        onChange={handleChange}
      />
    </Flex>
  )
}
