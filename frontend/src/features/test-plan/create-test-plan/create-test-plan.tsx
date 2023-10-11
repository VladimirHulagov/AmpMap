import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { useState } from "react"

import { CreateTestPlanModal } from "./create-test-plan-modal"

export const CreateTestPlan = ({ type = "main" }: { type: "main" | "child" }) => {
  const [isShow, setIsShow] = useState(false)

  return (
    <>
      <Button
        id={type === "main" ? "create-test-plan" : "create-child-test-plan"}
        icon={<PlusOutlined />}
        onClick={() => setIsShow(true)}
        type={"primary"}
      >
        {type === "main" ? "Create Test Plan" : "Create Child Test Plan"}
      </Button>
      <CreateTestPlanModal isShow={isShow} setIsShow={setIsShow} />
    </>
  )
}
