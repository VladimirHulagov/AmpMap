import { DownOutlined } from "@ant-design/icons"
import { Button, Modal, Tree } from "antd"
import Search from "antd/lib/input/Search"

import { useSelectSuiteModal } from "../../model/use-select-suite-modal"
import "./index.css"

export type SelectSuiteModalProps = {
  opened: boolean
  onCancel: () => void
  onSubmit: (suiteId: number) => void
  treeSuites: ISuite[]
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
        expandedKeys={expandedKeys}
        onExpand={onExpand}
        autoExpandParent={autoExpandParent}
      />
    </Modal>
  )
}
