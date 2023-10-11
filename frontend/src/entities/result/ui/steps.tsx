import { Divider } from "antd"

import { Steps } from "shared/ui"

interface TestResultStepsProps {
  stepsResult: StepResult[]
}

export const TestResultSteps = ({ stepsResult }: TestResultStepsProps) => {
  return (
    <>
      <Divider orientation="left" style={{ margin: 0, fontSize: 14 }}>
        Steps
      </Divider>
      <Steps.Result stepsResult={stepsResult} />
    </>
  )
}
