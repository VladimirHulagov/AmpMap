import { CopyOutlined } from "@ant-design/icons"
import { Button, Input, Modal } from "antd"

import { SearchField } from "widgets/search-field"

import { useTestCaseCopyModal } from "./use-test-case-copy-modal"

export const CopyTestCase = ({ testCase }: { testCase: TestCase }) => {
  const {
    isShow,
    isLoading,
    selectedSuite,
    newName,
    dataTestSuites,
    isLoadingTestSuites,
    handleClear,
    handleSave,
    handleCancel,
    handleShow,
    handleChange,
    handleChangeName,
    handleLoadNextPageData,
    handleSearch,
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
        <SearchField
          select={selectedSuite}
          isLastPage={!!dataTestSuites?.pages.next}
          data={dataTestSuites?.results}
          isLoading={isLoadingTestSuites}
          onClear={handleClear}
          onSearch={handleSearch}
          onChange={handleChange}
          handleLoadNextPageData={handleLoadNextPageData}
          placeholder="Search a test suite"
        />
      </Modal>
    </>
  )
}
