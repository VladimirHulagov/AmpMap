import { Dropdown, MenuProps } from "antd"
import { useState } from "react"

import { DeleteTestCase } from "../delete-test-case/delete-test-case"
import { ArchiveTestCaseModal } from "./archive-test-case-modal"

export const ArchiveTestCase = ({ testCase }: { testCase: TestCase }) => {
  const [isShow, setIsShow] = useState(false)

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: <DeleteTestCase testCase={testCase} />,
    },
  ]

  return (
    <>
      <Dropdown.Button
        className="archive-test-case"
        menu={{ items }}
        danger
        onClick={() => setIsShow(true)}
      >
        Archive
      </Dropdown.Button>
      <ArchiveTestCaseModal isShow={isShow} setIsShow={setIsShow} testCase={testCase} />
    </>
  )
}
