import { CopyOutlined } from "@ant-design/icons"
import { Button, Input, Modal } from "antd"
import { useParams } from "react-router-dom"

import { useLazyGetTestSuitesQuery } from "entities/suite/api"
import { testSuiteSearchValueFormat } from "entities/suite/lib/utils"

import { SearchFieldImprove } from "widgets/search-field-improve"

import { useTestCaseCopyModal } from "./use-test-case-copy-modal"

export const CopyTestCase = ({ testCase }: { testCase: TestCase }) => {
  const { projectId } = useParams<ParamProjectId>()
  const [getSuites] = useLazyGetTestSuitesQuery()

  const {
    isShow,
    isLoading,
    selectedSuite,
    newName,
    handleClearSelected,
    handleSave,
    handleCancel,
    handleShow,
    handleSelectSuite,
    handleChangeName,
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
          id="copy-test-case-name"
          placeholder="Please enter a name"
          onChange={handleChangeName}
          value={newName}
          autoFocus={true}
          style={{ marginBottom: "16px" }}
        />
        <SearchFieldImprove
          id="copy-test-case-suite"
          getData={getSuites}
          onSelect={handleSelectSuite}
          onClear={handleClearSelected}
          dataParams={{
            project: projectId,
            is_flat: true,
          }}
          selected={selectedSuite}
          placeholder="Search a test suite"
          searchKey="search"
          valueFormat={testSuiteSearchValueFormat}
        />
      </Modal>
    </>
  )
}
