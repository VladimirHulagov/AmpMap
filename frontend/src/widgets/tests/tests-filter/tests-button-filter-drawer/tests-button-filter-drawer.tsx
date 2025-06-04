import { SearchOutlined } from "@ant-design/icons"
import { Badge, DatePicker, Flex, Form, Input } from "antd"
import dayjs, { Dayjs } from "dayjs"
import { StatusFilter } from "entities/status/ui"
import { useMeContext } from "processes"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { LabelFilter, LabelFilterCondition, LabelFilterValue } from "entities/label/ui"

import {
  clearFilter,
  reinitializeFilter,
  resetFilterSettings,
  resetFormComplete,
  selectFilter,
  selectFilterCount,
  selectFilterSettings,
  selectOrdering,
  selectShouldResetForm,
  testEmptyFilter,
  testFilterSchema,
  updateFilter,
  updateFilterSettings,
  updateOrdering,
} from "entities/test/model"

import {
  useLazyGetDescendantsTreeQuery,
  useLazyGetTestPlanSuitesQuery,
} from "entities/test-plan/api"

import { AssigneeFilter } from "entities/user/ui"

import { FilterControl } from "features/filter"

import { useProjectContext } from "pages/project"

import FilterPlusIcon from "shared/assets/yi-icons/filter-plus.svg?react"
import { orderingSchema } from "shared/config/query-schemas"
import { useUrlSyncParams } from "shared/hooks"
import { Button, Drawer, EntityTreeFilter, Toggle } from "shared/ui"

import styles from "./styles.module.css"

type DateFields =
  | "test_plan_started_after"
  | "test_plan_started_before"
  | "test_plan_created_after"
  | "test_plan_created_before"
  | "test_created_after"
  | "test_created_before"

interface Props {
  resetSelectedRows: () => void
}

export const TestsButtonFilterDrawer = ({ resetSelectedRows }: Props) => {
  const { t } = useTranslation()

  const project = useProjectContext()
  const { me } = useMeContext()
  const { testPlanId } = useParams<ParamTestPlanId & ParamTestSuiteId>()

  const dispatch = useAppDispatch()
  const testsFilter = useAppSelector(selectFilter)
  const testsOrdering = useAppSelector(selectOrdering)
  const testsFilterSettings = useAppSelector(selectFilterSettings)
  const testsFilterCount = useAppSelector(selectFilterCount)
  const testsShouldResetForm = useAppSelector(selectShouldResetForm)
  const [isOpenFilter, setIsOpenFilter] = useState(false)

  const [getSuiteTree] = useLazyGetTestPlanSuitesQuery()
  const [getTestPlanTree] = useLazyGetDescendantsTreeQuery()

  const { control, handleSubmit, setValue, getValues, watch, reset } = useForm<TestDataFilters>({
    defaultValues: testsFilter,
  })

  const isArchive = watch("is_archive")

  useEffect(() => {
    if (testsShouldResetForm) {
      reset(testEmptyFilter)
      dispatch(resetFormComplete())
    }
  }, [testsShouldResetForm])

  const handleUpdateFilterData = (params: Partial<TestDataFilters>) => {
    dispatch(updateFilter(params))
  }

  const syncOrdering = { ordering: testsOrdering }
  useUrlSyncParams({
    params: syncOrdering as unknown as Record<string, unknown>,
    queryParamsSchema: orderingSchema(),
    updateParams: (params) => {
      dispatch(updateOrdering(params.ordering as string))
    },
  })

  useUrlSyncParams({
    params: testsFilter as unknown as Record<string, unknown>,
    queryParamsSchema: testFilterSchema,
    updateParams: handleUpdateFilterData,
  })

  const handleUpdateFilterSettings = (params: Partial<FilterSettings>) => {
    dispatch(updateFilterSettings(params))
  }

  const handleClearFilter = () => {
    dispatch(clearFilter())
  }

  const handleOpenFilter = () => {
    setIsOpenFilter(true)
  }

  const handleCloseFilter = () => {
    setIsOpenFilter(false)
  }

  const onSubmit: SubmitHandler<TestDataFilters> = (data) => {
    resetSelectedRows()
    dispatch(updateFilter(data))
  }

  const triggerSubmit = () => {
    handleSubmit(onSubmit)()
  }

  const handleSelectLabelCondition = (value: LabelCondition) => {
    setValue("labels_condition", value)
    triggerSubmit()
  }

  const handleAssigneeToMe = () => {
    if (!me) return
    const stateAssignee = getValues("assignee").filter((i) => i !== String(me.id))
    setValue("assignee", [String(me.id), ...stateAssignee])
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
    return getSuiteTree({
      parent: testPlanId ? Number(testPlanId) : null,
      project: project.id,
    }).unwrap()
  }

  const getPlansTreeData = () => {
    return getTestPlanTree({
      parent: testPlanId ? Number(testPlanId) : null,
      project: project.id,
    }).unwrap()
  }

  const getSuitesTreeDataFromRoot = () => {
    return getSuiteTree({ project: project.id, parent: null }).unwrap()
  }

  const getPlansTreeDataFromRoot = () => {
    return getTestPlanTree({ project: project.id, parent: null }).unwrap()
  }

  const getDateValue = (key: DateFields) => (getValues(key) ? dayjs(getValues(key)) : undefined)

  useEffect(() => {
    if (
      testsFilterSettings.filterProjectId !== null &&
      testsFilterSettings.filterProjectId !== project.id
    ) {
      dispatch(clearFilter())
      dispatch(resetFilterSettings())
      return
    }

    dispatch(updateFilterSettings({ filterProjectId: project.id }))
  }, [project.id, testsFilterSettings.filterProjectId])

  useEffect(() => {
    dispatch(reinitializeFilter())
  }, [])

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
        {!!testsFilterCount && (
          <Badge
            color="var(--y-color-accent)"
            count={testsFilterCount}
            data-testid="tests-button-filter-drawer-badge"
          />
        )}
      </Button>
      <Drawer
        id="tests-drawer-filter"
        header={
          <FilterControl
            type="plans"
            hasSomeFilter={!!testsFilterCount}
            filterData={testsFilter as unknown as Record<string, unknown>}
            filterSchema={testFilterSchema}
            filterSettings={testsFilterSettings}
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
              data-testid="tests-button-filter-drawer-name-or-id-label"
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
                    data-testid="tests-button-filter-drawer-name-or-id-input"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("Test Plan")}
              data-testid="tests-button-filter-drawer-test-plan-container"
            >
              <Controller
                name="plans"
                control={control}
                render={({ field }) => (
                  <EntityTreeFilter
                    getData={getPlansTreeData}
                    getDataFromRoot={getPlansTreeDataFromRoot}
                    type="plans"
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
              label={t("Test Suite")}
              data-testid="tests-button-filter-drawer-test-suite-container"
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
              label={t("Status")}
              data-testid="tests-button-filter-drawer-status-container"
            >
              <Controller
                name="statuses"
                control={control}
                render={({ field }) => (
                  <StatusFilter
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      triggerSubmit()
                    }}
                    onClear={() => {
                      field.onChange([])
                      triggerSubmit()
                    }}
                    data-testid="tests-button-filter-drawer-status-filter-select"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              className={styles.formBetween}
              label={
                <div className={styles.formLabel}>
                  <span>{t("Assignee")}</span>
                  <button
                    type="button"
                    className={styles.assigneeToMe}
                    onClick={handleAssigneeToMe}
                    data-testid="tests-button-filter-drawer-assignee-to-me"
                  >
                    {t("Assigned to me")}
                  </button>
                </div>
              }
              data-testid="tests-button-filter-drawer-assignee-container"
            >
              <Controller
                name="assignee"
                control={control}
                render={({ field }) => (
                  <AssigneeFilter
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      triggerSubmit()
                    }}
                    onClear={() => {
                      field.onChange([])
                      triggerSubmit()
                    }}
                    project={project}
                    placeholder={t("Search a user")}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              className={styles.formBetween}
              label={
                <div
                  className={styles.formLabel}
                  data-testid="tests-button-filter-drawer-labels-label"
                >
                  <span>{t("Label")}</span>
                  <LabelFilterCondition
                    value={getValues("labels_condition") ?? "and"}
                    onChange={handleSelectLabelCondition}
                    disabled={getValues("labels").length + getValues("not_labels").length < 2}
                  />
                </div>
              }
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
            <Form.Item label={t("Test Plan Start Date")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_started_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_started_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_plan_started_before")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-start-date-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_started_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_started_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_plan_started_after")}
                  minDate={getDateValue("test_plan_started_after")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-start-date-before"
                />
              </Flex>
            </Form.Item>
            <Form.Item label={t("Test Plan Created At")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_created_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_created_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_plan_created_before")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-created-at-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_created_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_created_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_plan_created_after")}
                  minDate={getDateValue("test_plan_created_after")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-created-at-before"
                />
              </Flex>
            </Form.Item>
            <Form.Item label={t("Test Created At")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_created_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_created_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_created_before")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-created-at-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_created_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_created_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_created_after")}
                  minDate={getDateValue("test_created_after")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-created-at-before"
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
