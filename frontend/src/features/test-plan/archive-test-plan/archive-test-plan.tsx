import { Dropdown, MenuProps } from "antd"
import { useState } from "react"

import { DeleteTestPlan } from "../delete-test-plan/delete-test-plan"
import { ArchiveTestPlanModal } from "./archive-test-plan-modal"

interface Props {
  testPlan: ITestPlanTreeView
}

export const ArchiveTestPlan = ({ testPlan }: Props) => {
  const [isShow, setIsShow] = useState(false)

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: <DeleteTestPlan testPlan={testPlan} />,
    },
  ]

  return (
    <>
      <Dropdown.Button menu={{ items }} danger onClick={() => setIsShow(true)}>
        Archive
      </Dropdown.Button>
      <ArchiveTestPlanModal isShow={isShow} setIsShow={setIsShow} testPlan={testPlan} />
    </>
  )
}
