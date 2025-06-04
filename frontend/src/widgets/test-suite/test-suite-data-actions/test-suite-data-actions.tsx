import { Divider, Dropdown, Flex, MenuProps, Tooltip, Typography } from "antd"
import { memo, useContext } from "react"
import { useTranslation } from "react-i18next"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useLazyGetTestSuiteAncestorsQuery, useLazyGetTestSuitesQuery } from "entities/suite/api"

import { useBulkUpdateMutation } from "entities/test-case/api"
import {
  clearFilter,
  selectFilter,
  selectFilterCount,
  selectSettings,
  updateFilterSettings,
  updateSettings,
} from "entities/test-case/model"

import { ClearFilters } from "features/filter"
import { ChangeBulkLabel } from "features/label"
import { CreateTestCase } from "features/test-case"

import { useProjectContext } from "pages/project"

import CollapseIcon from "shared/assets/icons/arrows-in-simple.svg?react"
import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { saveVisibleColumns } from "shared/libs"
import { antdNotification } from "shared/libs/antd-modals"
import { deleteEmptyParams } from "shared/libs/query-params"
import { Button, DataViewSelect } from "shared/ui"

import { SettingsColumnVisibility } from "widgets/settings-column-visibility/settings-column-visibility"
import {
  TestCasesButtonFilterDrawer,
  TestCasesSavedFilters,
  TestCasesSorter,
  TestCasesTreeContext,
} from "widgets/test-case"

import { MoveEntity } from "../../../features/common"
import styles from "./styles.module.css"

interface Props {
  dataView: "list" | "tree"
  setDataView: (dataView: "list" | "tree") => void
  suite?: Suite
  isFetching: boolean
}

const getSelectedTestsCount = (tableSettings: TestCaseTableParams) => {
  if (!tableSettings.isAllSelectedTableBulk) {
    return tableSettings.selectedRows.length
  }

  return tableSettings.count - tableSettings.excludedRows.length
}

export const TestSuiteDataActions = memo(({ dataView, setDataView, suite, isFetching }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const { testCasesTree } = useContext(TestCasesTreeContext)!
  const [bulkUpdateTestCases, { isLoading }] = useBulkUpdateMutation()
  const [getSuites] = useLazyGetTestSuitesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()
  const project = useProjectContext()

  const dispatch = useAppDispatch()
  const tableSettings = useAppSelector(selectSettings<TestCaseTableParams>("table"))
  const treeSettings = useAppSelector(selectSettings<TestCaseTableParams>("tree"))
  const testCasesSelectedCount = useAppSelector(selectFilterCount)
  const testCasesFilter = useAppSelector(selectFilter)

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
    saveVisibleColumns(`test-cases-visible-cols-${key}`, newVisibleColumns)
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
    const commonFilters: Partial<TestCaseGetFilters> = deleteEmptyParams({
      is_archive: testCasesFilter.is_archive,
      search: testCasesFilter.name_or_id,
      labels: testCasesFilter.labels,
      labels_condition: testCasesFilter.labels_condition,
      suite: testCasesFilter.suites,
      test_suite_created_before: testCasesFilter.test_suite_created_before,
      test_suite_created_after: testCasesFilter.test_suite_created_after,
      test_case_created_before: testCasesFilter.test_case_created_before,
      test_case_created_after: testCasesFilter.test_case_created_after,
    })

    const reqData: TestCaseBulkUpdate = {
      filter_conditions: commonFilters,
      included_cases: [] as number[],
      excluded_cases: [] as number[],
      current_suite: Number(suite?.id),
      project: project.id,
    }

    if (tableSettings.isAllSelectedTableBulk) {
      reqData.excluded_cases = tableSettings.excludedRows
    } else {
      reqData.included_cases = tableSettings.selectedRows
    }

    return reqData
  }

  const handleClearFilter = () => {
    dispatch(updateFilterSettings({ selected: null }))
    dispatch(clearFilter())
  }

  const handleMoveSubmit = async (selectedSuite: number, onLoading?: (toggle: boolean) => void) => {
    const reqData = prepareBulkRequestData()
    reqData.suite = selectedSuite
    onLoading?.(true)
    const result = await bulkUpdateTestCases(reqData)
    //@ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    resetSelectedRows()
    onLoading?.(false)
    antdNotification.success("move-test-cases", {
      description: t("entities:testCase.MoveSuccess"),
    })
  }

  const handleBulkAddLabel = async (
    labels: LabelInForm[],
    operationType: ChangeLabelBulkOperationType
  ) => {
    const reqData = prepareBulkRequestData()
    reqData.labels = labels
    reqData.labels_action = operationType

    const result = await bulkUpdateTestCases(reqData)
    //@ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    resetSelectedRows()
  }

  const selectedCount = getSelectedTestsCount(tableSettings)

  const bulkActions: MenuProps["items"] = [
    {
      key: "move",
      label: (
        <MoveEntity
          onSubmit={handleMoveSubmit}
          name="plan"
          id="cases"
          isLoading={isLoading}
          title={t("Move cases to suite")}
          label={t("Parent suite")}
          placeholder={t("Search a test suite")}
          // @ts-ignore
          getEntities={getSuites}
          // @ts-ignore
          getAncestor={getAncestors}
        />
      ),
    },
    {
      key: "addLabel",
      label: <ChangeBulkLabel onSubmit={handleBulkAddLabel} selectedCount={selectedCount} />,
    },
  ]

  return (
    <Flex justify="space-between" align="center" style={{ width: "100%", marginBottom: 24 }}>
      <Flex gap={16} align="center">
        <Typography.Title
          level={2}
          style={{ marginBottom: 0, alignSelf: "center", textWrap: "nowrap" }}
        >
          {t("Test Cases")}
        </Typography.Title>
        <CreateTestCase parentSuite={suite} loading={isFetching} />
        {tableSettings.hasBulk && (
          <>
            <Dropdown
              menu={{ items: bulkActions }}
              trigger={["click"]}
              openClassName={styles.actionMenuButton}
            >
              <Button color="accent" style={{ gap: 4 }} data-testid="test-cases-actions-dropdown">
                <span>{t("Actions")}</span>
                <ArrowIcon width={16} height={16} className={styles.actionMenuArrow} />
              </Button>
            </Dropdown>
            <span>{`${t("Items Selected")} ${selectedCount}`}</span>
          </>
        )}
      </Flex>
      <Flex gap={8} wrap justify="flex-end" align="center">
        <Flex gap={8} align="center">
          <ClearFilters isVisible={!!testCasesSelectedCount} onClear={handleClearFilter} />
          <TestCasesButtonFilterDrawer />
          <TestCasesSavedFilters />
          <TestCasesSorter />
        </Flex>
        {!isList && (
          <Tooltip title={t("Collapse All")}>
            <Button
              icon={<CollapseIcon width={18} height={18} color="var(--y-grey-35)" />}
              onClick={() => testCasesTree.current?.closeAll()}
              shape="square"
              color="secondary-linear"
              data-testid="test-cases-collapse-all-btn"
            />
          </Tooltip>
        )}
        <SettingsColumnVisibility
          id={
            isList ? "test-cases-table-setting-columns-btn" : "test-cases-tree-setting-columns-btn"
          }
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

TestSuiteDataActions.displayName = "TestSuiteDataAction"
