import { DownOutlined } from "@ant-design/icons"
import { Button, Modal, Tree } from "antd"
import Search from "antd/lib/input/Search"

import "./index.css"
import { useSelectSuiteModal } from "./use-select-suite-modal"

export interface SelectSuiteModalProps {
  opened: boolean
  onCancel: () => void
  onSubmit: (suiteId: number, suiteName?: string) => void
  selectedSuiteId: number
}

export const SelectSuiteModal = (props: SelectSuiteModalProps) => {
  const {
    handleSubmit,
    handleChange,
    hadleChangeSuite,
    treeData,
    expandedKeys,
    onExpand,
    autoExpandParent,
    selectedKeys,
  } = useSelectSuiteModal(props)
  const { opened, onCancel } = props

  if (!opened) {
    return null
  }

  return (
    <Modal
      title="Select suite"
      open={opened}
      onCancel={onCancel}
      width="700px"
      className="select-suite-modal"
      footer={[
        <Button id="close-btn" key="back" onClick={onCancel}>
          Close
        </Button>,
        <Button id="select-suite" key="submit" onClick={handleSubmit} type="primary">
          Select
        </Button>,
      ]}
    >
      <Search style={{ marginBottom: 8 }} placeholder="Search" onChange={handleChange} />
      <Tree
        showLine
        switcherIcon={<DownOutlined />}
        selectedKeys={selectedKeys}
        onSelect={hadleChangeSuite}
        treeData={treeData}
        expandedKeys={[...expandedKeys, ...selectedKeys]}
        onExpand={onExpand}
        autoExpandParent={autoExpandParent}
      />
    </Modal>
  )
}
