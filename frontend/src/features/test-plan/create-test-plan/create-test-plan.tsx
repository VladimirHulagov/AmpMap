import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { CreateTestPlanModal } from "./create-test-plan-modal"

interface Props {
  testPlan?: TestPlanTreeView
}

export const CreateTestPlan = ({ testPlan }: Props) => {
  const [isShow, setIsShow] = useState(false)

  return (
    <>
      <Button
        id={!testPlan ? "create-test-plan" : "create-child-test-plan"}
        icon={<PlusOutlined />}
        onClick={() => setIsShow(true)}
        type={"primary"}
        disabled={testPlan?.is_archive}
      >
        {!testPlan ? "Create Test Plan" : "Create Child Test Plan"}
      </Button>
      <CreateTestPlanModal isShow={isShow} setIsShow={setIsShow} testPlan={testPlan} />
    </>
  )
}
