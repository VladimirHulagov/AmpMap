import { Flex } from "antd"
import equal from "fast-deep-equal"
import { useMeContext } from "processes"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useProjectContext } from "pages/project"

import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { QuryParamsSchema, queryParamsBySchema } from "shared/libs/query-params"

import { ActionButtonsFilter } from "./ui/action-buttons-filter/action-buttons-filter"
import { SelectFilter } from "./ui/select-filter/select-filter"

interface Props {
  type: "plans" | "suites"
  hasSomeFilter: boolean
  filterData: Record<string, unknown>
  filterSchema: QuryParamsSchema
  filterSettings: FilterSettings
  updateFilter: (filter: Record<string, unknown>) => void
  updateSettings: (settings: Partial<FilterSettings>) => void
  clearFilter: () => void
}

export const FilterControl = ({
  type,
  hasSomeFilter,
  filterData,
  filterSchema,
  filterSettings,
  updateFilter,
  updateSettings,
  clearFilter,
}: Props) => {
  const { t } = useTranslation()

  const { userConfig, updateConfig } = useMeContext()
  const project = useProjectContext()

  const configFilters =
    type === "plans"
      ? userConfig?.test_plans?.filters?.[project.id]
      : userConfig?.test_suites?.filters?.[project.id]

  const handleDelete = (name: string) => {
    antdModalConfirm("delete-filter", {
      title: t("Do you want to delete this filter?"),
      okText: t("Delete"),
      onOk: async () => {
        const filtersData = { ...(configFilters ?? {}) }
        delete filtersData[name]

        const typeKey = type === "plans" ? "test_plans" : "test_suites"
        await updateConfig({
          ...userConfig,
          [typeKey]: {
            ...userConfig?.[typeKey],
            filters: {
              [project.id]: {
                ...filtersData,
              },
            },
          },
        })

        if (filterSettings.selected === name) {
          updateSettings({ selected: null })
          clearFilter()
        }

        antdNotification.success("delete-filter", {
          description: t("Filter deleted successfully"),
        })
      },
    })
  }

  const handleSelect = (name: string) => {
    const value = configFilters?.[name]
    const filterParse = queryParamsBySchema(filterSchema, { url: value })
    updateFilter(filterParse)
  }

  const handleResetToSelected = () => {
    if (!filterSettings.selected) {
      return
    }
    const value = configFilters?.[filterSettings.selected]
    const filterParse = queryParamsBySchema(filterSchema, { url: value })
    updateFilter(filterParse)
  }

  useEffect(() => {
    if (!hasSomeFilter || !configFilters || filterSettings.selected) {
      return
    }

    const urlParse = queryParamsBySchema(filterSchema)
    for (const [filterName, filterValue] of Object.entries(configFilters)) {
      const filterParse = queryParamsBySchema(filterSchema, { url: filterValue })
      const isEqualUrlFilter = equal(urlParse, filterParse)
      if (isEqualUrlFilter) {
        updateSettings({ selected: filterName })
        return
      }
    }
  }, [hasSomeFilter, configFilters, filterSettings.selected])

  return (
    <Flex align="center" justify="space-between">
      <SelectFilter
        type={type}
        filterData={filterData}
        filterSettings={filterSettings}
        configFilters={configFilters}
        filterSchema={filterSchema}
        onDelete={handleDelete}
        onSelect={handleSelect}
        updateSettings={updateSettings}
      />
      <ActionButtonsFilter
        type={type}
        filterData={filterData}
        filterSettings={filterSettings}
        onDelete={handleDelete}
        updateSettings={updateSettings}
        resetFilterToSelected={handleResetToSelected}
        clearFilter={clearFilter}
      />
    </Flex>
  )
}
