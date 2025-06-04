import { Divider, Dropdown, Flex, MenuProps, Tooltip, Typography } from "antd"
import { memo, useContext } from "react"
import { useTranslation } from "react-i18next"
import { SettingsColumnVisibility } from "widgets"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useBulkUpdateMutation } from "entities/test/api"
import {
  clearFilter,
  selectFilter,
  selectFilterCount,
  selectSettings,
  updateFilterSettings,
  updateSettings,
} from "entities/test/model"

import { useLazyGetTestPlanAncestorsQuery, useLazyGetTestPlansQuery } from "entities/test-plan/api"

import { MoveEntity } from "features/common"
import { ClearFilters } from "features/filter"
import { DeleteTests } from "features/test-plan/delete-tests/delete-tests"
import { AssignTestsBulk } from "features/test-result"
import { AddBulkResult } from "features/test-result/bulk-add-result/add-bulk-result"

import { useProjectContext } from "pages/project"

import CollapseIcon from "shared/assets/icons/arrows-in-simple.svg?react"
import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { NOT_ASSIGNED_FILTER_VALUE } from "shared/constants"
import { deleteEmptyParams, saveVisibleColumns } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { Button, DataViewSelect } from "shared/ui"

import {
  TestsButtonFilterDrawer,
  TestsSavedFilters,
  TestsSorter,
  TestsTreeContext,
} from "widgets/tests"

import styles from "./styles.module.css"

const MAX_SELECTED_TESTS_FOR_ASYNC_BULK_ACTION = 1000

const getSelectedTestsCount = (tableSettings: TestTableParams) => {
  if (!tableSettings.isAllSelectedTableBulk) {
    return tableSettings.selectedRows.length
  }

  return tableSettings.count - tableSettings.excludedRows.length
}

const getObjectFromFormField = (fields?: AddBulkResultCommonFormField[]) => {
  if (!fields) {
    return
  }

  const object: Record<string, string> = {}

  fields.forEach((field) => {
    if (field.value && field.label) {
      object[field.label] = field.value
    }
  })

  return object
}

const prepareSuiteSpecificFields = (
  specificFields?: AddBulkResultSuiteSpecificFormField[],
  bulkFields?: BulkSuiteSpecificFormField[],
  isBulk?: boolean
) => {
  if (!specificFields || (isBulk && !bulkFields)) {
    return
  }

  const preparedFields = isBulk
    ? specificFields.map(({ label, value, ...otherFields }) => ({
        ...otherFields,
        label,
        value: bulkFields?.find((bulkField) => bulkField.label === label)?.value ?? value,
      }))
    : specificFields

  const suiteIds = Array.from(new Set(preparedFields.map(({ suite_id }) => suite_id)))

  return suiteIds.map((suiteId) => {
    const fields = preparedFields.filter(({ suite_id }) => suiteId === suite_id)

    return {
      suite_id: suiteId,
      values: getObjectFromFormField(fields)!,
    }
  })
}

interface Props {
  testPlanId?: number
  dataView: "tree" | "list"
  setDataView: (dataView: "tree" | "list") => void
}

export const TestPlanDataActions = memo(({ testPlanId, dataView, setDataView }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const project = useProjectContext()
  const { testsTree } = useContext(TestsTreeContext)!

  const dispatch = useAppDispatch()
  const tableSettings = useAppSelector(selectSettings<TestTableParams>("table"))
  const treeSettings = useAppSelector(selectSettings<TestTreeParams>("tree"))
  const testsFilter = useAppSelector(selectFilter)
  const testsSelectedCount = useAppSelector(selectFilterCount)
  const selectedCount = getSelectedTestsCount(tableSettings)

  const [bulkUpdateTests, { isLoading }] = useBulkUpdateMutation()
  const [getPlans] = useLazyGetTestPlansQuery()
  const [getAncestors] = useLazyGetTestPlanAncestorsQuery()

  const isList = dataView === "list"
  const visibleColumns = isList ? tableSettings.visibleColumns : treeSettings.visibleColumns
  const columns = isList ? tableSettings.columns : treeSettings.columns

  const handleChangeVisibleColumns = (newVisibleColumns: ColumnParam[]) => {
    const key = isList ? "table" : "tree"
    dispatch(
      updateSettings({
        key,
        settings: {
          visibleColumns: newVisibleColumns,
        },
      })
    )
    saveVisibleColumns(`tests-visible-cols-${key}`, newVisibleColumns)
  }

  const resetSelectedRows = () => {
    dispatch(
      updateSettings({
        key: "table",
        settings: {
          selectedRows: [],
          excludedRows: [],
          isAllSelectedTableBulk: false,
          hasBulk: false,
        },
      })
    )
  }

  const prepareBulkRequestData = () => {
    const commonFilters: Partial<TestGetFilters> = deleteEmptyParams({
      is_archive: testsFilter.is_archive,
      last_status: testsFilter.statuses,
      search: testsFilter.name_or_id,
      labels: testsFilter.labels,
      not_labels: testsFilter.not_labels,
      labels_condition: testsFilter.labels_condition,
      suite: testsFilter.suites,
      plan: testsFilter.plans,
      assignee: testsFilter.assignee.filter((user) => user !== NOT_ASSIGNED_FILTER_VALUE),
      unassigned: testsFilter.assignee?.includes(NOT_ASSIGNED_FILTER_VALUE) ? true : undefined,
      test_plan_started_before: testsFilter?.test_plan_started_before,
      test_plan_started_after: testsFilter?.test_plan_started_after,
      test_plan_created_before: testsFilter?.test_plan_created_before,
      test_plan_created_after: testsFilter?.test_plan_created_after,
      test_created_before: testsFilter?.test_created_before,
      test_created_after: testsFilter?.test_created_after,
    })

    const reqData: TestBulkUpdate = {
      // @ts-ignore // TODO fix equial param plan in TestBulkUpdate and TestGetFilters
      filter_conditions: commonFilters,
      included_tests: [] as number[],
      excluded_tests: [] as number[],
      current_plan: testPlanId ? Number(testPlanId) : undefined,
      project: project.id,
    }
    if (tableSettings.isAllSelectedTableBulk) {
      reqData.excluded_tests = tableSettings.excludedRows
    } else {
      reqData.included_tests = tableSettings.selectedRows
    }

    return reqData
  }

  const handleDeleteTests = async () => {
    const reqData = prepareBulkRequestData()

    reqData.is_deleted = true

    await bulkUpdateTests(reqData).unwrap()

    resetSelectedRows()
  }

  const handleMoveSubmit = async (plan: number, onLoading?: (toggle: boolean) => void) => {
    const reqData = prepareBulkRequestData()
    reqData.plan_id = plan
    onLoading?.(true)
    const result = await bulkUpdateTests(reqData)
    //@ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    resetSelectedRows()
    onLoading?.(false)
    antdNotification.success("move-tests", {
      description: t("entities:test.MoveSuccess"),
    })
  }

  const handleBulkAssignSubmit = async (assignee: string | null) => {
    const reqData = prepareBulkRequestData()
    reqData.assignee_id = assignee ? Number(assignee) : null
    const result = await bulkUpdateTests(reqData)
    // @ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    resetSelectedRows()
  }

  const handleBulkResultSubmit = async (formData: AddBulkResultFormData) => {
    const reqData = prepareBulkRequestData()

    reqData.result = {
      comment: formData.comment,
      status: Number(formData.status),
      attachments: formData.attachments,
      attributes: {
        non_suite_specific: getObjectFromFormField(formData.non_suite_specific),
        suite_specific: prepareSuiteSpecificFields(
          formData.suite_specific,
          formData.bulk_suite_specific,
          formData.is_bulk_suite_specific
        ),
      },
    }

    const isAsync = selectedCount > MAX_SELECTED_TESTS_FOR_ASYNC_BULK_ACTION
    reqData.is_async = isAsync

    if (isAsync) {
      antdModalConfirm("async-operation-modal-confirm", {
        title: t("Async operation"),
        content: t(
          "Bulk operation for selected number of items would take some time and would be completed asynchronously. We will notify you about the completion. Please keep in mind that the other bulk operations would be unavailable till the end of this one."
        ),
        cancelButtonProps: { style: { display: "none" } },
      })
    }

    const result = await bulkUpdateTests(reqData)
    // @ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    resetSelectedRows()
  }

  const handleClearFilter = () => {
    dispatch(updateFilterSettings({ selected: null }))
    dispatch(clearFilter())
    resetSelectedRows()
  }

  const actionItems: MenuProps["items"] = [
    {
      key: "move",
      label: (
        <MoveEntity
          onSubmit={handleMoveSubmit}
          name="plan"
          id="tests"
          isLoading={isLoading}
          title={t("Move test to plan")}
          label={t("Parent plan")}
          placeholder={t("Search a test plan")}
          // @ts-ignore
          getEntities={getPlans}
          // @ts-ignore
          getAncestor={getAncestors}
        />
      ),
    },
    {
      key: "assign",
      label: <AssignTestsBulk onSubmit={handleBulkAssignSubmit} isLoading={isLoading} />,
    },
    {
      key: "addResult",
      label: (
        <AddBulkResult
          onSubmit={handleBulkResultSubmit}
          selectedCount={selectedCount}
          getBulkRequestData={prepareBulkRequestData}
        />
      ),
    },
    {
      key: "deleteTests",
      label: <DeleteTests onSubmit={handleDeleteTests} count={selectedCount} />,
    },
  ]

  return (
    <Flex justify="space-between" align="flex-end" style={{ width: "100%", marginBottom: 24 }}>
      <Flex vertical gap={16}>
        <Flex align="center" wrap gap={16}>
          <Typography.Title level={2} style={{ marginBottom: 0, textWrap: "nowrap" }}>
            {t("Tests")}
          </Typography.Title>
          {tableSettings.hasBulk && dataView === "list" && (
            <Flex gap={8} align="center">
              <Dropdown
                menu={{ items: actionItems }}
                trigger={["click"]}
                openClassName={styles.actionMenuButton}
              >
                <Button color="accent" style={{ gap: 4 }} id="tests-actions-dropdown">
                  <span>{t("Actions")}</span>
                  <ArrowIcon width={16} height={16} className={styles.actionMenuArrow} />
                </Button>
              </Dropdown>
              <div>
                <span style={{ marginRight: 4 }}>{t("Items Selected")}</span>
                <span data-testid="selected-tests-count">{selectedCount}</span>
              </div>
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex gap={8} wrap justify="flex-end" align="center">
        <Flex gap={8} align="center">
          <ClearFilters isVisible={!!testsSelectedCount} onClear={handleClearFilter} />
          <TestsButtonFilterDrawer resetSelectedRows={resetSelectedRows} />
          <TestsSavedFilters resetSelectedRows={resetSelectedRows} />
          <TestsSorter />
        </Flex>
        {!isList && (
          <Tooltip title={t("Collapse All")}>
            <Button
              icon={<CollapseIcon width={18} height={18} color="var(--y-grey-35)" />}
              onClick={() => testsTree.current?.closeAll()}
              shape="square"
              color="secondary-linear"
              data-testid="test-plan-detail-action-collapse-all-button"
            />
          </Tooltip>
        )}
        <SettingsColumnVisibility
          id={isList ? "tests-table-setting-columns-btn" : "tests-tree-setting-columns-btn"}
          columns={columns}
          visibilityColumns={visibleColumns}
          onChange={handleChangeVisibleColumns}
        />
        <Divider type="vertical" style={{ height: "1.5em" }} />
        <DataViewSelect value={dataView} onChange={setDataView} />
      </Flex>
    </Flex>
  )
})

TestPlanDataActions.displayName = "TestPlanDataActions"
