import { Button } from "antd"
import { useState } from "react"

import { TestResultEditModal } from "./test-result-edit-modal"

export const EditResult = ({
  testCase,
  testResult,
  isDisabled,
}: {
  testCase: ITestCase
  testResult: IResult
  isDisabled: boolean
}) => {
  const [isShow, setIsShow] = useState(false)

  return (
    <>
      <Button
        id="edit-result"
        onClick={() => setIsShow(true)}
        type="link"
        style={{
          border: "none",
          padding: 0,
          height: "auto",
          lineHeight: 1,
        }}
        disabled={isDisabled}
      >
        <span style={{ textDecoration: "underline" }}>Edit</span>
      </Button>
      <TestResultEditModal
        isShow={isShow}
        setIsShow={setIsShow}
        testResult={testResult}
        testCase={testCase}
      />
    </>
  )
}
