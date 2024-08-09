import { CopyOutlined } from "@ant-design/icons"
import { Button, Tooltip } from "antd"
import { useState } from "react"

import { TestResultEditCloneModal } from "./test-result-edit-clone-modal"

interface Props {
  testCase: TestCase
  testResult: IResult
  isDisabled: boolean
  isClone: boolean
}

export const EditCloneResult = ({ testCase, testResult, isDisabled, isClone }: Props) => {
  const [isShow, setIsShow] = useState(false)

  return (
    <>
      <Button
        id={`edit${isClone ? "-clone" : ""}-result`}
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
        <span style={{ textDecoration: "underline" }}>
          {!isClone ? (
            "Edit"
          ) : (
            <Tooltip placement="topRight" title="Clone test result">
              <CopyOutlined />
            </Tooltip>
          )}
        </span>
      </Button>
      <TestResultEditCloneModal
        isShow={isShow}
        setIsShow={setIsShow}
        testResult={testResult}
        testCase={testCase}
        isClone={isClone}
      />
    </>
  )
}
