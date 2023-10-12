import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { CreateResultModal } from "./create-result-modal"

export const AddResult = ({
  isDisabled,
  testCase,
}: {
  isDisabled: boolean
  testCase: TestCase
}) => {
  const [isShow, setIsShow] = useState(false)

  return (
    <>
      <Button
        id="add-result-btn"
        type="primary"
        onClick={() => setIsShow(true)}
        icon={<PlusOutlined />}
        disabled={isDisabled}
      >
        Add Result
      </Button>
      <CreateResultModal isShow={isShow} setIsShow={setIsShow} testCase={testCase} />
    </>
  )
}
