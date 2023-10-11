import { Alert, Select, Space } from "antd"
import { DeleteTestCase, EditTestCase } from "features/test-case"
import { Controller } from "react-hook-form"

import { useTestCaseDetail } from "entities/test-case/model"

import { ContainerLoader } from "shared/ui"
import { ResizableDrawer } from "shared/ui/resizable-drawer/resizable-drawer"

import { TestCaseFields } from "../test-case-fields"

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
      title={<p style={{ margin: 0 }}>{showTestCase?.name}</p>}
      placement="right"
      onClose={handleClose}
      open={!!showTestCase}
      extra={
        <Space size="middle">
          {showTestCase.versions.length > 1 && (
            <Controller
              name="select"
              control={control}
              defaultValue={showTestCase.current_version}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Version"
                  style={{ minWidth: "100px", marginLeft: 14 }}
                  options={versionData}
                  defaultValue={showTestCase.current_version}
                  onChange={(value) => handleChange(value)}
                  value={showVersion}
                />
              )}
            />
          )}
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
