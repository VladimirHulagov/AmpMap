import { HistoryOutlined } from "@ant-design/icons"
import { Button, Card, Col, Descriptions, Empty, Row, Space, Tag } from "antd"
import dayjs from "dayjs"
import { ArchiveTestPlan, CreateTestPlan, DeleteTestPlan, EditTestPlan } from "features/test-plan"
import React from "react"
import { Link } from "react-router-dom"
import { TestPlanStatistics } from "widgets"

import { useTestPlanDetails } from "entities/test-plan/model"
import { TestPlanTableWrapper } from "entities/test-plan/ui"

import { colors } from "shared/config"
import { ContainerLoader, Markdown } from "shared/ui"

import { TestDetail, TestsTable } from "widgets/tests"

interface TestPlanDetailProps {
  collapse: boolean
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
}

export const TestPlanDetail = ({ collapse, setCollapse }: TestPlanDetailProps) => {
  const { isLoading, testPlanId, projectId, test, testPlan } = useTestPlanDetails()

  if (isLoading || !testPlanId) return <ContainerLoader />
  if (!testPlan) return <Empty />

  return (
    <>
      {!!testPlan.children.length && (
        <TestPlanTableWrapper activePlan={testPlan} collapse={collapse} setCollapse={setCollapse} />
      )}
      <Row>
        <Col span={24}>
          <Card>
            <Row>
              <Col flex={"auto"}>
                <p style={{ margin: 0, fontSize: 22 }} id="test-plan-title">
                  {testPlan.title}
                </p>
              </Col>
              <Col flex={"none"}>
                <Space size="middle">
                  <Button type="link" style={{ border: "1px solid" }}>
                    <Link
                      to={`/projects/${projectId}/plans/${testPlanId}/activity`}
                      style={{ fontSize: 15 }}
                    >
                      View Activity
                      <HistoryOutlined style={{ marginLeft: 6 }} />
                    </Link>
                  </Button>
                  <CreateTestPlan testPlan={testPlan} />
                  <EditTestPlan testPlan={testPlan} />
                  {testPlan.is_archive ? (
                    <DeleteTestPlan testPlan={testPlan} />
                  ) : (
                    <ArchiveTestPlan testPlan={testPlan} />
                  )}
                </Space>
              </Col>
            </Row>
            <Descriptions style={{ marginTop: 12 }}>
              {!!testPlan.started_at && (
                <Descriptions.Item label="Start date">
                  {dayjs(testPlan.started_at).format("YYYY-MM-DD")}
                </Descriptions.Item>
              )}
              {!!testPlan.due_date && (
                <Descriptions.Item label="Due date">
                  {dayjs(testPlan.due_date).format("YYYY-MM-DD")}
                </Descriptions.Item>
              )}
              {!!testPlan.finished_at && (
                <Descriptions.Item label="Finish date">
                  {dayjs(testPlan.finished_at).format("YYYY-MM-DD")}
                </Descriptions.Item>
              )}
              {testPlan.is_archive && (
                <Descriptions.Item>
                  <Tag color={colors.error}>Archived</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            {testPlan.description && (
              <>
                <span
                  className="ant-descriptions-item-label"
                  style={{ marginBottom: 8, display: "block" }}
                >
                  Description
                </span>
                <div id="test-plan-description">
                  <Markdown content={testPlan.description} />
                </div>
              </>
            )}
            <TestPlanStatistics testPlanId={testPlanId} />
            <TestsTable testPlanId={Number(testPlanId)} />
          </Card>
        </Col>
      </Row>
      <TestDetail test={test} />
    </>
  )
}
