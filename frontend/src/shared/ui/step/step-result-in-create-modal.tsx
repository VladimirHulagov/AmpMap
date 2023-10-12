import { Select } from "antd"

import { statuses } from "shared/config"

import styles from "./styles.module.css"

interface StepResultProps {
  testCase: TestCase
  steps: {
    [stepId: string]: string
  }
  setSteps: React.Dispatch<
    React.SetStateAction<{
      [stepId: string]: string
    }>
  >
}

export const StepResultInCreateModal = ({ testCase, steps, setSteps }: StepResultProps) => {
  const handleStepChange = (stepId: string, value: string) => {
    setSteps((prevState) => ({ ...prevState, [stepId]: value }))
  }

  if (!testCase.steps) return <></>

  return (
    <ul style={{ paddingLeft: 0 }} className={styles.fieldUl}>
      {testCase.steps.map((item) => (
        <li className={styles.resultFieldItem} key={item.id}>
          <div className={styles.resultFieldIcon}>{item.sort_order}</div>
          <div className={styles.resultModalFieldWrapper}>
            <div className={styles.resultModalFieldContent}>
              <div>{item.name}</div>
            </div>
          </div>
          <div className={styles.resultSelect}>
            <Select
              value={steps[item.id]}
              placeholder="Please select"
              style={{ width: "100%" }}
              options={statuses}
              onSelect={(value) => handleStepChange(item.id, value)}
              defaultValue={statuses[1].value}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
