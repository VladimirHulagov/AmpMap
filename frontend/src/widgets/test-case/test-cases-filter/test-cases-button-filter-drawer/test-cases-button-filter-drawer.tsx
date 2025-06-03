import { SearchOutlined } from "@ant-design/icons"
import { Badge, DatePicker, Flex, Form, Input } from "antd"
import dayjs, { Dayjs } from "dayjs"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { LabelFilter, LabelFilterCondition, LabelFilterValue } from "entities/label/ui"

import { useLazyGetDescendantsTreeQuery } from "entities/suite/api"

import {
  clearFilter,
  resetFilterSettings,
  resetFormComplete,
  selectFilter,
  selectFilterCount,
  selectFilterSettings,
  selectOrdering,
  selectShouldResetForm,
  testCasesEmptyFilter,
  testCasesFilterSchema,
  testCasesOrderingSchema,
  updateFilter,
  updateFilterSettings,
  updateOrdering,
} from "entities/test-case/model"

import { FilterControl } from "features/filter"

import { useProjectContext } from "pages/project"

import FilterPlusIcon from "shared/assets/yi-icons/filter-plus.svg?react"
import { useUrlSyncParams } from "shared/hooks"
import { Button, Drawer, EntityTreeFilter, Toggle } from "shared/ui"

import styles from "./styles.module.css"

type DateFields =
  | "test_suite_created_after"
  | "test_suite_created_before"
  | "test_case_created_after"
  | "test_case_created_before"

export const TestCasesButtonFilterDrawer = () => {
  const { t } = useTranslation()

  const project = useProjectContext()
  const { testSuiteId } = useParams<ParamTestSuiteId>()

  const dispatch = useAppDispatch()
  const testCasesFilter = useAppSelector(selectFilter)
  const testCasesOrdering = useAppSelector(selectOrdering)
  const testCasesFilterSettings = useAppSelector(selectFilterSettings)
  const testCasesFilterCount = useAppSelector(selectFilterCount)
  const testCasesShouldResetForm = useAppSelector(selectShouldResetForm)
  const [isOpenFilter, setIsOpenFilter] = useState(false)

  const [getSuiteTree] = useLazyGetDescendantsTreeQuery()

  const { control, handleSubmit, getValues, setValue, watch, reset } = useForm<TestCaseDataFilters>(
    {
      defaultValues: testCasesFilter,
    }
  )

  const isArchive = watch("is_archive")

  useEffect(() => {
    if (testCasesShouldResetForm) {
      reset(testCasesEmptyFilter)
      dispatch(resetFormComplete())
    }
  }, [testCasesShouldResetForm])

  const handleUpdateFilterData = (params: Partial<TestDataFilters>) => {
    dispatch(updateFilter(params))
  }

  const handleUpdateFilterSettings = (params: Partial<FilterSettings>) => {
    dispatch(updateFilterSettings(params))
  }

  const handleClearFilter = () => {
    dispatch(clearFilter())
  }

  const objectOrdering = { ordering: testCasesOrdering }
  useUrlSyncParams({
    params: objectOrdering as unknown as Record<string, unknown>,
    queryParamsSchema: testCasesOrderingSchema,
    updateParams: (params) => {
      dispatch(updateOrdering(params.ordering as string))
    },
  })

  useUrlSyncParams({
    params: testCasesFilter as unknown as Record<string, unknown>,
    queryParamsSchema: testCasesFilterSchema,
    updateParams: handleUpdateFilterData,
  })

  const handleOpenFilter = () => {
    setIsOpenFilter(true)
  }

  const handleCloseFilter = () => {
    setIsOpenFilter(false)
  }

  const onSubmit: SubmitHandler<TestCaseDataFilters> = (data) => {
    dispatch(updateFilter(data))
  }

  const triggerSubmit = () => {
    handleSubmit(onSubmit)()
  }

  const handleSelectLabelCondition = (value: LabelCondition) => {
    setValue("labels_condition", value)
    triggerSubmit()
  }

  const handleLabelsChange = (value: LabelFilterValue) => {
    setValue("labels", value.labels)
    setValue("not_labels", value.not_labels)
    setValue(
      "labels_condition",
      value.labels.length + value.not_labels.length < 2 ? undefined : value.labels_condition
    )
    triggerSubmit()
  }

  const handleUpdateDate = (value: Dayjs | null, key: DateFields) => {
    if (key.includes("_after") && value === null) {
      setValue(key, undefined, { shouldDirty: true })
      setValue(key.replace("_after", "_before") as DateFields, undefined, {
        shouldDirty: true,
      })
    } else {
      setValue(key, value ? value.format("YYYY-MM-DD") : undefined, { shouldDirty: true })
    }

    triggerSubmit()
  }

  const handleShowArchiveChange = (toggle: boolean) => {
    setValue("is_archive", toggle ? toggle : undefined)
    triggerSubmit()
  }

  const getSuitesTreeData = () => {
    return getSuiteTree(
      { parent: testSuiteId ? Number(testSuiteId) : null, project: project.id },
      true
    ).unwrap()
  }

  const getSuitesTreeDataFromRoot = () => {
    return getSuiteTree({ project: project.id, parent: null }, true).unwrap()
  }

  const getDateValue = (key: DateFields) => (getValues(key) ? dayjs(getValues(key)) : undefined)

  useEffect(() => {
    if (
      testCasesFilterSettings.filterProjectId !== null &&
      testCasesFilterSettings.filterProjectId !== project.id
    ) {
      dispatch(clearFilter())
      dispatch(resetFilterSettings())
      return
    }

    dispatch(updateFilterSettings({ filterProjectId: project.id }))
  }, [project.id, testCasesFilterSettings.filterProjectId])

  return (
    <>
      <Button
        id="btn-filter-test-plan"
        icon={<FilterPlusIcon width={18} height={18} />}
        onClick={handleOpenFilter}
        style={{ gap: 4, width: "fit-content" }}
        color="secondary-linear"
      >
        {t("Filter")}{" "}
        {!!testCasesFilterCount && (
          <Badge
            color="var(--y-color-accent)"
            count={testCasesFilterCount}
            data-testid="test-cases-button-filter-drawer-badge"
          />
        )}
      </Button>
      <Drawer
        id="tests-drawer-filter"
        header={
          <FilterControl
            type="suites"
            filterData={testCasesFilter as unknown as Record<string, unknown>}
            hasSomeFilter={!!testCasesFilterCount}
            filterSchema={testCasesFilterSchema}
            filterSettings={testCasesFilterSettings}
            updateFilter={handleUpdateFilterData}
            updateSettings={handleUpdateFilterSettings}
            clearFilter={handleClearFilter}
          />
        }
        onClose={handleCloseFilter}
        isOpen={isOpenFilter}
        isLoading={false}
      >
        {isOpenFilter && (
          <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
            <Form.Item
              label={t("Name or ID")}
              data-testid="test-cases-button-filter-drawer-name-or-id-container"
            >
              <Controller
                name="name_or_id"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t("Search")}
                    onBlur={triggerSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        triggerSubmit()
                      }
                    }}
                    onChange={(e) => field.onChange(e.target.value)}
                    suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
                    allowClear
                    data-testid="test-cases-button-filter-drawer-name-or-id-input"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("Test Suite")}
              data-testid="test-cases-button-filter-drawer-test-suite-container"
            >
              <Controller
                name="suites"
                control={control}
                render={({ field }) => (
                  <EntityTreeFilter
                    getData={getSuitesTreeData}
                    getDataFromRoot={getSuitesTreeDataFromRoot}
                    type="suites"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      triggerSubmit()
                    }}
                    onClear={() => {
                      field.onChange([])
                      triggerSubmit()
                    }}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              className={styles.formBetween}
              label={
                <div className={styles.formLabel}>
                  <span>{t("Label")}</span>
                  <LabelFilterCondition
                    value={getValues("labels_condition") ?? "and"}
                    onChange={handleSelectLabelCondition}
                    disabled={getValues("labels").length + getValues("not_labels").length < 2}
                  />
                </div>
              }
              data-testid="test-cases-button-filter-drawer-labels-container"
            >
              <Controller
                name="labels"
                control={control}
                render={() => (
                  <LabelFilter
                    value={{
                      labels: getValues("labels"),
                      not_labels: getValues("not_labels"),
                      labels_condition: getValues("labels_condition") ?? "and",
                    }}
                    onChange={handleLabelsChange}
                  />
                )}
              />
            </Form.Item>
            <Form.Item label={t("Test Suite Created At")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_suite_created_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_suite_created_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_suite_created_before")}
                  allowClear
                  data-testid="test-cases-button-filter-drawer-test-suite-created-at-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_suite_created_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_suite_created_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_suite_created_after")}
                  minDate={getDateValue("test_suite_created_after")}
                  allowClear
                  data-testid="test-cases-button-filter-drawer-test-suite-created-at-before"
                />
              </Flex>
            </Form.Item>
            <Form.Item label={t("Test Case Created At")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_case_created_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_case_created_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_case_created_before")}
                  allowClear
                  data-testid="test-cases-button-filter-drawer-test-case-created-at-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_case_created_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_case_created_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_case_created_after")}
                  minDate={getDateValue("test_case_created_after")}
                  allowClear
                  data-testid="test-cases-button-filter-drawer-test-case-created-at-before"
                />
              </Flex>
            </Form.Item>
            <Form.Item>
              <Controller
                name="is_archive"
                control={control}
                render={() => (
                  <Toggle
                    id="archive-toggle"
                    label={t("Show Archived")}
                    labelFontSize={14}
                    checked={isArchive}
                    onChange={handleShowArchiveChange}
                    size="lg"
                  />
                )}
              />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </>
  )
}
