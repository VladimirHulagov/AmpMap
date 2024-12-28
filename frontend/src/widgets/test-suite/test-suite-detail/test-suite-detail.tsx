import { Col, Divider } from "antd"

import { useTestSuiteDetails } from "entities/suite/model"

import {
  TestCaseDetail,
  TestCasesTable,
  TestCasesTreeProvider,
  TestsCasesTree,
} from "widgets/test-case"

import { TestSuiteDetailAction, TestSuiteDetailHeader, TestSuiteDetailHeaderSkeleton } from "./ui"

export const TestSuiteDetail = () => {
  const { suite, isLoading, dataView, setDataView, refetch } = useTestSuiteDetails()

  return (
    <TestCasesTreeProvider>
      <Col flex="1 0">
        {isLoading && (
          <>
            <TestSuiteDetailHeaderSkeleton />
            <Divider />
          </>
        )}
        {!isLoading && suite && (
          <>
            <TestSuiteDetailHeader suite={suite} refetch={refetch} />
            <Divider />
          </>
        )}
        <TestSuiteDetailAction dataView={dataView} setDataView={setDataView} suite={suite} />
        {dataView === "list" && <TestCasesTable />}
        {dataView === "tree" && <TestsCasesTree />}
        <TestCaseDetail />
      </Col>
    </TestCasesTreeProvider>
  )
}
