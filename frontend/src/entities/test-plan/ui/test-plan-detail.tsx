import { HistoryOutlined } from "@ant-design/icons"
import { Button, Card, Col, Descriptions, Empty, Row, Space, Tag } from "antd"
import { ArchiveTestPlan, CreateTestPlan, DeleteTestPlan, EditTestPlan } from "features/test-plan"
import moment from "moment"
import React from "react"
import { Link } from "react-router-dom"

import { TestDetail } from "entities/test/ui/test-detail"
import { TestsTable } from "entities/test/ui/tests-table"

import { useTestPlanDetails } from "entities/test-plan/model"

import { colors } from "shared/config"
import { ContainerLoader } from "shared/ui"

import { TestPlanStatistics } from "./test-plan-statistics"
import { TestPlanTableWrapper } from "./test-plan-table-wrapper"

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
                <p style={{ margin: 0, fontSize: 22 }}>{testPlan.title}</p>
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
                  <CreateTestPlan type="child" />
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
                  {moment(testPlan.started_at).format("YYYY-MM-DD")}
                </Descriptions.Item>
              )}
              {!!testPlan.due_date && (
                <Descriptions.Item label="Due date">
                  {moment(testPlan.due_date).format("YYYY-MM-DD")}
                </Descriptions.Item>
              )}
              {!!testPlan.finished_at && (
                <Descriptions.Item label="Finish date">
                  {moment(testPlan.finished_at).format("YYYY-MM-DD")}
                </Descriptions.Item>
              )}
              {testPlan.is_archive && (
                <Descriptions.Item>
                  <Tag color={colors.error}>Archived</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            {testPlan.description && (
              <Descriptions>
                <Descriptions.Item label="Description">
                  <span style={{ whiteSpace: "break-spaces" }}>{testPlan.description}</span>
                </Descriptions.Item>
              </Descriptions>
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
