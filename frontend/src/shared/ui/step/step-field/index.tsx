import { Divider } from "antd"

import { StepFieldItem } from "./step-field-item"

interface StepFieldProps {
  steps: Step[]
}

export const StepField = ({ steps }: StepFieldProps) => {
  return (
    <>
      <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
        Steps
      </Divider>
      <ul style={{ paddingLeft: 0, marginTop: 8 }}>
        {steps.map((step) => (
          <StepFieldItem key={step.id} step={step} />
        ))}
      </ul>
    </>
  )
}
