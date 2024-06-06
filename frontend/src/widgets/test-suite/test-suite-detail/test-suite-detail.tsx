import { Card, Col, Divider, Empty, Row, Space } from "antd"
import { CopySuite, CreateSuite, DeleteSuite, EditSuite } from "features/suite"
import { CreateTestCase } from "features/test-case"
import React from "react"

import { useTestSuiteDetails } from "entities/suite/model"

import { ContainerLoader, Markdown } from "shared/ui"

import { TestCasesTable } from "widgets/test-case"

import { TestSuiteTableWrapper } from "../test-suite-table/test-suite-table-wrapper"
import styles from "./styles.module.css"

interface TestSuiteDetailsProps {
  collapse: boolean
  setCollapse: React.Dispatch<React.SetStateAction<boolean>>
}

export const TestSuiteDetail = ({ collapse, setCollapse }: TestSuiteDetailsProps) => {
  const {
    shortDesc,
    suite,
    isLoading,
    isShowMore,
    descriptionLines,
    handleShowMoreClick,
    handleRefetch,
  } = useTestSuiteDetails()

  if (isLoading) return <ContainerLoader />
  if (!suite) return <Empty />

  return (
    <>
      {!!suite.child_count && (
        <TestSuiteTableWrapper activeSuite={suite} collapse={collapse} setCollapse={setCollapse} />
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
                  <CreateSuite suite={suite} onSubmit={handleRefetch} />
                  <CopySuite suite={suite} />
                  <EditSuite suite={suite} />
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
      </Row>
    </>
  )
}
