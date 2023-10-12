import { CopyOutlined } from "@ant-design/icons"
import { Button, Input, Modal, Select } from "antd"

import { useSuiteCopyModal } from "./use-suite-copy-modal"

export const CopySuite = ({ suite }: { suite: ISuite }) => {
  const {
    isShow,
    isLoading,
    projects,
    newName,
    handleSave,
    handleCancel,
    handleShow,
    handleChange,
    handleChangeName,
  } = useSuiteCopyModal(suite)

  return (
    <>
      <Button id="copy-test-suite" icon={<CopyOutlined />} onClick={handleShow}>
        Copy
      </Button>
      <Modal
        className="copy-test-suite-modal"
        title={`Copy Test Suite '${suite.name}'`}
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
        <Select
          showSearch
          placeholder="Please select project"
          notFoundContent="No matches"
          defaultActiveFirstOption={false}
          labelInValue
          style={{ width: "100%" }}
          options={projects}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? "").toLowerCase().localeCompare((optionB?.label ?? "").toLowerCase())
          }
          onChange={handleChange}
        />
      </Modal>
    </>
  )
}
