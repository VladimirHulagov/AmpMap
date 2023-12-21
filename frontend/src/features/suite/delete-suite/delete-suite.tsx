import { DeleteOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { DeleteTestSuiteModal } from "./delete-test-suite-modal"

export const DeleteSuite = ({ suite }: { suite: Suite }) => {
  const [isShowTestSuiteDeleteModal, setIsShowTestSuiteDeleteModal] = useState(false)

  return (
    <>
      <Button
        id="delete-test-suite"
        icon={<DeleteOutlined />}
        danger
        onClick={() => setIsShowTestSuiteDeleteModal(true)}
      >
        Delete
      </Button>
      <DeleteTestSuiteModal
        testSuite={suite}
        isShow={isShowTestSuiteDeleteModal}
        setIsShow={setIsShowTestSuiteDeleteModal}
      />
    </>
  )
}
