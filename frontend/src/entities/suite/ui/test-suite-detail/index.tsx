import { Card, Col, Divider, Empty, Row, Space } from "antd"
import { CopySuite, CreateSuite, DeleteSuite, EditSuite } from "features/suite"
import { CreateTestCase } from "features/test-case"
import React from "react"

import { useTestSuiteDetails } from "entities/suite/model"
import { TestCaseIdContext } from "entities/suite/ui/test-suite-detail/test-case-context"

import { TestCasesTable } from "entities/test-case/ui/test-cases-table"

import { ContainerLoader, Markdown } from "shared/ui"

import { TestCaseDetail } from "widgets/test-case/test-case-detail/test-case-detail"

import { TestSuiteTableWrapper } from "../test-suite-table-wrapper"
import styles from "./styles.module.css"

interface TestSuiteDetailsProps {
  collapse: boolean
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
}

export const TestSuiteDetail = ({ collapse, setCollapse }: TestSuiteDetailsProps) => {
  const {
    shortDesc,
    testCaseId,
    suite,
    isLoading,
    isShowMore,
    descriptionLines,
    setTestCaseId,
    handleShowMoreClick,
  } = useTestSuiteDetails()

  if (isLoading) return <ContainerLoader />
  if (!suite) return <Empty />

  return (
    <>
      <TestCaseIdContext.Provider value={{ testCaseId, setTestCaseId }}>
        {!!suite.children.length && (
          <TestSuiteTableWrapper
            activeSuite={suite}
            collapse={collapse}
            setCollapse={setCollapse}
          />
        )}
        <Row>
          <Col flex="1 0">
            <Card>
              <Row align={"middle"}>
                <Col flex={"auto"}>
                  <p style={{ margin: 0, fontSize: 22 }}>{suite.name}</p>
                </Col>
                <Col flex={"none"}>
                  <Space size="middle">
                    <CreateSuite type="child" />
                    <CopySuite suite={suite} />
                    <EditSuite />
                    <DeleteSuite suite={suite} />
                  </Space>
                </Col>
              </Row>
              {suite.description.length ? (
                <>
                  <Divider plain orientation="left">
                    Description
                  </Divider>
                  <Row align="middle">
                    <Col flex="auto">
                      <Markdown content={isShowMore ? suite.description : shortDesc} />
                      {(descriptionLines.length > 3 || suite.description.length > 300) && (
                        <span className={styles.showMore} onClick={handleShowMoreClick}>
                          {isShowMore ? "Hide more" : "Show more"}
                        </span>
                      )}
                    </Col>
                  </Row>
                </>
              ) : null}
              <Divider />
              <Row align={"middle"}>
                <Col flex={"auto"}>
                  <p style={{ margin: 0, fontSize: 18 }}>Test Cases</p>
                </Col>
                <Col flex={"none"}>
                  <Space style={{ marginBottom: 16 }}>
                    <CreateTestCase />
                  </Space>
                </Col>
              </Row>

              <TestCasesTable />
            </Card>
          </Col>

          {testCaseId ? <TestCaseDetail testCaseId={testCaseId} /> : null}
        </Row>
      </TestCaseIdContext.Provider>
    </>
  )
}
