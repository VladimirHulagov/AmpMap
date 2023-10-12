import { DeleteOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { DeleteTestCaseModal } from "./delete-test-case-modal"

export const DeleteTestCase = ({ testCase }: { testCase: TestCase }) => {
  const [isShowTestCaseDeleteModal, setIsShowTestCaseDeleteModal] = useState(false)

  const handleDelete = async () => {
    setIsShowTestCaseDeleteModal(true)
  }

  return (
    <>
      <Button id="delete-test-case-detail" onClick={handleDelete} icon={<DeleteOutlined />} danger>
        Delete
      </Button>
      <DeleteTestCaseModal
        isShow={isShowTestCaseDeleteModal}
        setIsShow={setIsShowTestCaseDeleteModal}
        testCase={testCase}
      />
    </>
  )
}
