import { CopyOutlined } from "@ant-design/icons"
import { Button, Input, Modal } from "antd"

import { TestSuiteParentField } from "entities/suite/ui/test-suite-parent-field"

import { useTestCaseCopyModal } from "./use-test-case-copy-modal"

export const CopyTestCase = ({ testCase }: { testCase: TestCase }) => {
  const {
    isShow,
    isLoading,
    selectedSuite,
    handleClear,
    handleSave,
    handleCancel,
    handleShow,
    handleChange,
    handleChangeName,
    newName,
  } = useTestCaseCopyModal(testCase)

  return (
    <>
      <Button id="copy-test-case" icon={<CopyOutlined />} onClick={handleShow}>
        Copy
      </Button>
      <Modal
        className="copy-test-case-modal"
        title={`Copy Test Case '${testCase.name}'`}
        open={isShow}
        onCancel={handleCancel}
        centered
        footer={[
          <Button id="cancel-btn" key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            id="save-btn"
            key="submit"
            type="primary"
            loading={isLoading}
            onClick={handleSave}
            disabled={isLoading}
          >
            Save
          </Button>,
        ]}
      >
        <Input
          placeholder="Please enter a name"
          onChange={handleChangeName}
          value={newName}
          autoFocus={true}
          style={{ marginBottom: "16px" }}
        />
        <TestSuiteParentField
          handleClearParent={handleClear}
          handleSelectParent={handleChange}
          selectedParent={selectedSuite}
          placeholder="Please select a suite"
        />
      </Modal>
    </>
  )
}
