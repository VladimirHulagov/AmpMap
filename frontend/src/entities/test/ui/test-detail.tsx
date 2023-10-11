import { ArrowDownOutlined } from "@ant-design/icons"
import { Button, Checkbox, Space, Tabs } from "antd"
import { useGetCommentsQuery } from "entities/comments/api"
import { AddResult, AssignTo } from "features/test-result"
import { Link } from "react-router-dom"
import { Comments } from "widgets"

import { ResultList } from "entities/result/ui/result-list"

import { useTestDetail } from "entities/test/model"

import { TestCaseFields } from "entities/test-case/ui/test-case-fields"

import { ContainerLoader } from "shared/ui"
import { ResizableDrawer } from "shared/ui/resizable-drawer/resizable-drawer"

interface TestDetailProps {
  test: Test | null
}

export const TestDetail = ({ test }: TestDetailProps) => {
  const {
    testCase,
    isLoadingTestCase,
    isLoadingProject,
    project,
    showArchive,
    commentOrdering,
    tab,
    handleShowArchived,
    handleCloseDetails,
    handleCommentOrderingClick,
    handleTabChange,
  } = useTestDetail(test)
  const { data } = useGetCommentsQuery(
    {
      model: "test",
      object_id: String(test?.id),
      page: 1,
      page_size: 10,
    },
    {
      skip: !test,
    }
  )

  const operations = (
    <Button type="text" onClick={handleCommentOrderingClick}>
      <ArrowDownOutlined style={{ rotate: commentOrdering === "asc" ? "180deg" : "0deg" }} />
    </Button>
  )

  const isLoadingDrawer = isLoadingTestCase || isLoadingProject || !testCase || !project || !test

  return (
    <ResizableDrawer
      drawerKey="test_result_details"
      title={
        <>
          <p style={{ margin: 0 }}>{test?.name}</p>
          <Link
            style={{ color: "#999999", fontSize: 14, textDecoration: "underline" }}
            to={`/projects/${test?.project}/suites/${testCase?.suite}/?test_case=${testCase?.id}&version=${testCase?.current_version}`}
          >
            Actual ver. {testCase?.current_version}
          </Link>
        </>
      }
      placement="right"
      width={600}
      onClose={handleCloseDetails}
      open={!!test}
      extra={
        <Space>
          {!isLoadingDrawer && <AddResult isDisabled={project.is_archive} testCase={testCase} />}
        </Space>
      }
    >
      {isLoadingDrawer && <ContainerLoader />}
      {!isLoadingDrawer && (
        <>
          <TestCaseFields testCase={testCase} />
          <AssignTo />
          <Tabs
            defaultActiveKey="results"
            tabBarExtraContent={tab === "comments" ? operations : undefined}
            onChange={handleTabChange}
          >
            <Tabs.TabPane tab="Results" key="results">
              <ResultList
                testId={test?.id}
                testCase={testCase}
                isProjectArchive={project?.is_archive}
              />
              <div style={{ display: "flex", marginBottom: 8, float: "right" }}>
                <Checkbox checked={showArchive} onChange={handleShowArchived}>
                  Show Archived
                </Checkbox>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={`Comments (${data?.count || 0})`} key="comments">
              <Comments model="test" object_id={String(test.id)} ordering={commentOrdering} />
            </Tabs.TabPane>
          </Tabs>
        </>
      )}
    </ResizableDrawer>
  )
}
