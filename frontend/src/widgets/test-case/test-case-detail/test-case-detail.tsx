import { Alert, Select, Space } from "antd"
import { CopyTestCase, DeleteTestCase, EditTestCase } from "features/test-case"
import { Controller } from "react-hook-form"

import { useTestCaseDetail } from "entities/test-case/model"
import { TestCaseFields } from "entities/test-case/ui/test-case-fields"

import { ContainerLoader } from "shared/ui"
import { ResizableDrawer } from "shared/ui/resizable-drawer/resizable-drawer"

import "./styles.css"

interface TestCaseDetailProps {
  testCaseId: number
}

export const TestCaseDetail = ({ testCaseId }: TestCaseDetailProps) => {
  const {
    showTestCase,
    isLoadingTestCaseById,
    showVersion,
    versionData,
    control,
    handleClose,
    handleChange,
  } = useTestCaseDetail({ testCaseId })

  if (!showTestCase) return <></>

  return (
    <ResizableDrawer
      drawerKey="test_case_details"
      headerStyle={{
        display: "flex",
        alignItems: "flex-start",
        flexWrap: "wrap",
        width: "100%",
        gap: 14,
      }}
      className="testCaseDetailDrawer"
      title={
        <p
          style={{
            margin: 0,
            height: "100%",
            minHeight: 32,
            display: "flex",
            alignItems: "center",
          }}
        >
          {showTestCase?.name}
        </p>
      }
      placement="right"
      onClose={handleClose}
      open={!!showTestCase}
      extra={
        <Space size="middle" style={{ width: "100%", display: "flex", alignItems: "flex-end" }}>
          {showTestCase.versions.length > 1 && (
            <Controller
              name="select"
              control={control}
              defaultValue={showTestCase.current_version}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Version"
                  style={{ minWidth: "100px" }}
                  options={versionData}
                  defaultValue={showTestCase.current_version}
                  onChange={(value) => handleChange(value)}
                  value={showVersion}
                />
              )}
            />
          )}
          <CopyTestCase testCase={showTestCase} />
          <EditTestCase testCase={showTestCase} />
          <DeleteTestCase testCase={showTestCase} />
        </Space>
      }
    >
      {isLoadingTestCaseById ? (
        <ContainerLoader />
      ) : (
        <>
          {showVersion !== showTestCase.versions[0] && (
            <Alert
              showIcon={true}
              closable
              type="warning"
              description="Attention! This isn't the latest version"
              style={{ marginBottom: 20 }}
            />
          )}
          <TestCaseFields testCase={showTestCase} />
        </>
      )}
    </ResizableDrawer>
  )
}
