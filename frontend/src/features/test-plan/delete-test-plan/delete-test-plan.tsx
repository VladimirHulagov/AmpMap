import { DeleteOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { DeleteTestPlanModal } from "./delete-test-plan-modal"

interface Props {
  testPlan: ITestPlanTreeView
}

export const DeleteTestPlan = ({ testPlan }: Props) => {
  const [isShow, setIsShow] = useState(false)

  return (
    <>
      <Button
        id="delete-test-plan"
        icon={<DeleteOutlined />}
        danger
        onClick={() => setIsShow(true)}
      >
        Delete
      </Button>
      <DeleteTestPlanModal isShow={isShow} setIsShow={setIsShow} testPlan={testPlan} />
    </>
  )
}
