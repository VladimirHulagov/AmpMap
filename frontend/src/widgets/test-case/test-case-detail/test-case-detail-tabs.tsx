import { ArrowDownOutlined } from "@ant-design/icons"
import { Button, Tabs } from "antd"
import { useState } from "react"

import { Comments } from "widgets/comments"

import { TestCaseHistoryChanges } from "../test-case-history-changes/test-case-history-changes"
import { TestCaseTestsList } from "../test-case-tests-list/test-case-tests-list"

export const TestCaseDetailTabs = ({ testCase }: { testCase: TestCase }) => {
  const [activeTab, setActiveTab] = useState<string>("comments")
  const [commentsCount, setCommentsCount] = useState(0)
  const [commentOrdering, setCommentOrdering] = useState<Ordering>("desc")

  const handleCommentOrderingClick = () => {
    setCommentOrdering(commentOrdering === "asc" ? "desc" : "asc")
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const handleUpdateCommentsCount = (count: number) => {
    setCommentsCount(count)
  }

  return (
    <Tabs
      defaultActiveKey="comments"
      tabBarExtraContent={
        activeTab === "comments" ? (
          <Button type="text" onClick={handleCommentOrderingClick}>
            <ArrowDownOutlined style={{ rotate: commentOrdering === "asc" ? "180deg" : "0deg" }} />
          </Button>
        ) : undefined
      }
      onChange={handleTabChange}
    >
      <Tabs.TabPane tab={`Comments (${commentsCount})`} key="comments">
        <Comments
          model="testcase"
          object_id={String(testCase.id)}
          ordering={commentOrdering}
          onUpdateCommentsCount={handleUpdateCommentsCount}
        />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Tests" key="tests">
        <TestCaseTestsList testCase={testCase} />
      </Tabs.TabPane>
      <Tabs.TabPane tab="History" key="history">
        <TestCaseHistoryChanges testCase={testCase} />
      </Tabs.TabPane>
    </Tabs>
  )
}
