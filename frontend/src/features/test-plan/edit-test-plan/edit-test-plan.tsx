import { EditOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { EditTestPlanModal } from "./edit-test-plan-modal"

interface Props {
  testPlan: ITestPlanTreeView
}

export const EditTestPlan = ({ testPlan }: Props) => {
  const [isShow, setIsShow] = useState(false)

  return (
    <>
      <Button
        id="edit-test-plan"
        onClick={() => {
          setIsShow(true)
        }}
        icon={<EditOutlined />}
      >
        Edit
      </Button>
      <EditTestPlanModal isShow={isShow} setIsShow={setIsShow} testPlan={testPlan} />
    </>
  )
}
