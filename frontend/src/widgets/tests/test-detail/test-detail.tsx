import { Flex, Tabs, Typography } from "antd"
import classNames from "classnames"
import { useContext, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { Comments } from "widgets"

import { ResultList } from "entities/result/ui"

import { useTestDetail } from "entities/test/model"
import { TestDetailInfo } from "entities/test/ui"

import { AddResult } from "features/test-result"
import { AddResultView } from "features/test-result/add-result/add-result-view.tsx"
import { TestResultEditCloneView } from "features/test-result/edit-clone-result/test-result-edit-clone-view"

import { useProjectContext } from "pages/project"

import SortIcon from "shared/assets/yi-icons/sort.svg?react"
import { ArchivedTag, Drawer } from "shared/ui"

import { TestsTreeContext } from "../tests-tree"
import { ResultsAndComments } from "./results-and-comments.tsx"
import styles from "./styles.module.css"

export const TestDetail = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { testsTree } = useContext(TestsTreeContext)!
  const { testPlanId } = useParams<ParamTestPlanId>()

  const {
    drawerTest,
    testCase,
    isFetching,
    ordering,
    count,
    drawerView,
    all,
    tab,
    results,
    isFetchingList,
    selectedResult,
    handleCloseDetails,
    handleOrderingClick,
    handleTabChange,
    handleCancelAction,
    handleAddResultClick,
    handleEditCloneClick,
    setIsDirty,
  } = useTestDetail()
  const [commentsCount, setCommentsCount] = useState(0)

  const isLoadingDrawer = isFetching || !project || !drawerTest

  useEffect(() => {
    if (!isLoadingDrawer && location.hash && location.hash.includes("comment")) {
      handleTabChange("comments")
    }
  }, [location, isLoadingDrawer])

  const handleRefetch = async () => {
    if (String(drawerTest?.plan) === String(testPlanId)) {
      await testsTree.current?.initRoot({ initParent: testPlanId })
      return
    }

    await testsTree.current?.refetchNodeBy((node) => node.id === drawerTest?.plan)
  }

  const tabItems = useMemo(() => {
    if (!drawerTest || !testCase) {
      return []
    }

    return [
      {
        label: <span data-testid="all-tab">{t("All")}</span>,
        key: "all",
        children: (
          <ResultsAndComments
            testId={drawerTest.id}
            testCase={testCase}
            isProjectArchive={project.is_archive}
            entities={all}
            onActionClick={handleEditCloneClick}
            isFetching={isFetchingList}
            model="test"
            object_id={String(drawerTest.id)}
            ordering={ordering}
          />
        ),
      },
      {
        label: <span data-testid="results-tab">{t("Results")}</span>,
        key: "result",
        children: (
          <ResultList
            testId={drawerTest.id}
            testCase={testCase}
            isProjectArchive={project.is_archive}
            results={results}
            onActionClick={handleEditCloneClick}
            isFetching={isFetchingList}
          />
        ),
      },
      {
        label: <span data-testid="comments-tab">{t("Comments")}</span>,
        key: "comment",
        forceRender: true,
        children: (
          <Comments
            model="test"
            object_id={String(drawerTest.id)}
            ordering={ordering}
            onUpdateCommentsCount={setCommentsCount}
          />
        ),
      },
    ]
  }, [ordering, drawerTest, testCase, commentsCount, isFetchingList, results, tab])

  const tabBarExtraContent = useMemo(() => {
    return {
      left: (
        <Flex align="center" style={{ flexGrow: 1 }}>
          <div className={styles.resultsAndComments}>
            {t("Results & Comments")} {!isFetching && count ? ` (${count})` : ""}
          </div>
          <div className={styles.line} />
          <SortIcon
            className={classNames(styles.sortIcon, {
              [styles.descend]: ordering === "desc",
            })}
            onClick={handleOrderingClick}
            data-testid="change-ordering-icon"
            width={20}
            height={20}
          />
        </Flex>
      ),
    }
  }, [tab, ordering, commentsCount, results])

  return (
    <div>
      <Drawer
        id="drawer-test-detail"
        isOpen={!!drawerTest}
        isLoading={isLoadingDrawer}
        onClose={handleCloseDetails}
        minWidth={510}
        showSwipeElement={drawerView !== "test"}
        swipeElement={
          testCase && (
            <>
              {drawerView === "addResult" && (
                <AddResultView
                  testCase={testCase}
                  onClose={handleCancelAction}
                  onRefetch={handleRefetch}
                  onDirtyChange={(dirty: boolean) => {
                    setIsDirty(dirty)
                  }}
                />
              )}
              {selectedResult && (drawerView === "editResult" || drawerView === "cloneResult") && (
                <TestResultEditCloneView
                  onCancel={handleCancelAction}
                  testResult={selectedResult}
                  testCase={testCase}
                  isClone={drawerView === "cloneResult"}
                  onDirtyChange={(dirty: boolean) => {
                    setIsDirty(dirty)
                  }}
                />
              )}
            </>
          )
        }
        header={
          testCase &&
          drawerTest && (
            <>
              <Link
                className={styles.versionLink}
                to={`/projects/${drawerTest.project}/suites/${testCase.suite.id}/?test_case=${testCase.id}&version=${testCase.current_version}`}
                data-testid="test-detail-version"
              >
                {t("Actual ver.")} {testCase.current_version}
              </Link>
              <AddResult isDisabled={project.is_archive} onClick={handleAddResultClick} />
              <Flex align="center" gap={4} style={{ width: "100%" }}>
                {drawerTest.is_archive && <ArchivedTag data-testid="test-detail-archive-tag" />}
                <Typography.Title
                  level={3}
                  className={styles.title}
                  data-testid="test-detail-title"
                >
                  {drawerTest?.name}
                </Typography.Title>
              </Flex>
            </>
          )
        }
      >
        {testCase && drawerTest && (
          <div>
            <TestDetailInfo testCase={testCase} id="test-info" />
            <Flex justify="space-between" vertical>
              <Tabs
                defaultActiveKey="result"
                activeKey={tab}
                onChange={handleTabChange}
                tabBarExtraContent={tabBarExtraContent}
                items={tabItems}
                rootClassName={styles.testInfoTabs}
              />
            </Flex>
          </div>
        )}
      </Drawer>
    </div>
  )
}
