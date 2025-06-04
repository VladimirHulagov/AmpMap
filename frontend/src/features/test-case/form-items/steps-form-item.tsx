import { Form } from "antd"
import { useState } from "react"
import { Controller, useFieldArray, useFormContext } from "react-hook-form"

import { ScenarioFormLabel, StepsFormController } from "entities/test-case/ui"

import styles from "./styles.module.css"

interface Props {
  type: "create" | "edit"
  isSteps: boolean
  scenarioFormErrors: string
}

export const StepsFormItem = ({ type, isSteps, scenarioFormErrors }: Props) => {
  const { control, setValue } = useFormContext<TestCaseFormData>()
  const [expandedSteps, setExpandedSteps] = useState<number[]>([])
  const fieldArray = useFieldArray({
    name: "steps",
    control,
    keyName: "extraId",
  })

  const handleCollapse = () => {
    setExpandedSteps([])
  }

  const handleExpand = () => {
    setExpandedSteps(fieldArray.fields.map(({ id }) => id))
  }

  const handleToggleExpanded = (id: number) => {
    setExpandedSteps((prev) =>
      prev.includes(id) ? prev.filter((stepId) => stepId !== id) : [id, ...prev]
    )
  }

  return (
    <Form.Item
      label={
        <ScenarioFormLabel
          type={type}
          isSteps={isSteps}
          onIsStepsChange={(toggle) => setValue("is_steps", toggle)}
          onCollapse={handleCollapse}
          onExpand={handleExpand}
        />
      }
      validateStatus={scenarioFormErrors ? "error" : ""}
      help={scenarioFormErrors}
      required
      className={styles.formItem}
    >
      <Controller
        name="steps"
        control={control}
        render={() => (
          <StepsFormController
            fieldArray={fieldArray}
            expandedSteps={expandedSteps}
            onToggleExpanded={handleToggleExpanded}
          />
        )}
      />
    </Form.Item>
  )
}
