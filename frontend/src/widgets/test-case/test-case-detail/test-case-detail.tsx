import { Alert, Select, Space } from "antd"
import { CopyTestCase, DeleteTestCase, EditTestCase } from "features/test-case"
import { ArchiveTestCase } from "features/test-case/archive-test-case/archive-test-case"
import { Controller } from "react-hook-form"

import { TestCaseFields } from "entities/test-case/ui/test-case-fields"

import { ResizableDrawer } from "shared/ui/resizable-drawer/resizable-drawer"

import "./styles.css"
import { TestCaseDetailTabs } from "./test-case-detail-tabs"
import { useTestCaseDetail } from "./use-test-case-detail"

interface TestCaseDetailProps {
  testCase: TestCase | null
  onClose: () => void
}

export const TestCaseDetail = ({ testCase, onClose }: TestCaseDetailProps) => {
  const { showVersion, versionData, control, handleClose, handleChange, handleRestoreVersion } =
    useTestCaseDetail({
      testCase,
      onClose,
    })

  const isLastVersion = Number(testCase?.versions[0]) === Number(showVersion)

  return (
    <ResizableDrawer
      drawerKey="test_case_details"
      className="testCaseDetailDrawer"
      title={
        <p
          style={{
            margin: 0,
            height: "100%",
            minHeight: 32,
            display: "flex",
            alignItems: "center",
            minWidth: "60px",
          }}
        >
          {testCase?.name}
        </p>
      }
      placement="right"
      onClose={handleClose}
      open={!!testCase}
      extra={
        testCase && (
          <Space size="middle" style={{ width: "100%", display: "flex", alignItems: "flex-end" }}>
            {!!testCase.versions && testCase.versions.length > 1 && (
              <Controller
                name="select"
                control={control}
                defaultValue={testCase.current_version}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Version"
                    style={{ minWidth: "100px" }}
                    options={versionData}
                    defaultValue={testCase.current_version}
                    onChange={(value) => handleChange(value)}
                    value={showVersion}
                  />
                )}
              />
            )}
            <CopyTestCase testCase={testCase} />
            <EditTestCase testCase={testCase} />
            {!testCase.is_archive ? (
              <ArchiveTestCase testCase={testCase} />
            ) : (
              <DeleteTestCase testCase={testCase} />
            )}
          </Space>
        )
      }
    >
      <>
        {!isLastVersion && (
          <Alert
            showIcon={true}
            closable
            type="warning"
            description={
              <span>
                Attention! This isn&apos;t the latest version.{" "}
                <a onClick={handleRestoreVersion}>Restore</a>
              </span>
            }
            style={{ marginBottom: 20 }}
          />
        )}
        {testCase && (
          <>
            <TestCaseFields testCase={testCase} />
            <TestCaseDetailTabs testCase={testCase} />
          </>
        )}
      </>
    </ResizableDrawer>
  )
}
